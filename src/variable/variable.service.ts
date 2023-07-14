import { get, set } from 'lodash';
import { ConflictException, forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { Variable } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { ContextVariableValues, ServerVariableSpecification, ValueType, VariableDto, Visibility } from '@poly/model';
import { SecretService } from 'secret/secret.service';
import { CommonService } from 'common/common.service';
import { SpecsService } from 'specs/specs.service';
import { AuthData } from 'common/types';
import { AuthService } from 'auth/auth.service';
import { FunctionService } from 'function/function.service';
import { EventService } from 'event/event.service';
import { AiService } from 'ai/ai.service';

@Injectable()
export class VariableService {
  private readonly logger = new Logger(VariableService.name);

  constructor(
    private readonly commonService: CommonService,
    private readonly prisma: PrismaService,
    private readonly secretService: SecretService,
    @Inject(forwardRef(() => SpecsService))
    private readonly specsService: SpecsService,
    private readonly authService: AuthService,
    @Inject(forwardRef(() => FunctionService))
    private readonly functionService: FunctionService,
    private readonly eventService: EventService,
    private readonly aiService: AiService,
  ) {
  }

  async toDto(variable: Variable): Promise<VariableDto> {
    return {
      id: variable.id,
      context: variable.context,
      name: variable.name,
      description: variable.description,
      visibility: variable.visibility as Visibility,
      secret: variable.secret,
      value: variable.secret ? undefined : await this.getVariableValue(variable),
    };
  }

  async getAll(environmentId: string, contexts?: string[], names?: string[], ids?: string[], includePublic = false, includeTenant = false): Promise<Variable[]> {
    return this.prisma.variable.findMany({
      where: {
        AND: [
          {
            OR: [
              { environmentId },
              includePublic
                ? this.commonService.getPublicVisibilityFilterCondition()
                : {},
            ],
          },
          {
            OR: this.commonService.getContextsNamesIdsFilterConditions(contexts, names, ids),
          },
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: includeTenant
        ? {
            environment: {
              include: {
                tenant: true,
              },
            },
          }
        : undefined,
    });
  }

  async findById(id: string): Promise<Variable | null> {
    return this.prisma.variable.findFirst({
      where: {
        id,
      },
    });
  }

  async findByPath(environmentId: string, path: string): Promise<Variable | null> {
    const pathParts = path.split('.');

    // get private first
    let variables = await this.getAll(
      environmentId,
      [pathParts.slice(0, -1).join('.')],
      [pathParts[pathParts.length - 1]],
      undefined,
      false,
    );
    if (variables.length) {
      return variables[0];
    }

    // get public
    variables = await this.getAll(
      environmentId,
      [pathParts.slice(0, -1).join('.')],
      [pathParts[pathParts.length - 1]],
      undefined,
      true,
    );

    return variables[0] || null;
  }

  async getVariableValue(variable: Variable, path?: string) {
    const value = await this.secretService.get(variable.environmentId, variable.id);
    if (!path || typeof value !== 'object') {
      return value;
    }

    try {
      return this.commonService.getPathContent(value, path);
    } catch (e) {
      this.logger.error(`Error getting path content for variable ${variable.id}, path=${path}: ${e.message}`);
      return undefined;
    }
  }

  async createVariable(environmentId: string, context: string, name: string, description: string, value: ValueType, visibility: Visibility, secret = false): Promise<Variable> {
    this.logger.debug(`Creating variable '${name}' in context '${context}' for environment ${environmentId}`);

    name = this.commonService.sanitizeNameIdentifier(name);
    context = this.commonService.sanitizeContextIdentifier(context);

    if (!await this.checkContextAndNameDuplicates(environmentId, context, name)) {
      throw new ConflictException(`Variable with name '${name}' and context '${context}' already exists`);
    }

    description = description || (await this.aiService.getVariableDescription(name, context, secret, JSON.stringify(value))).description;

    return await this.prisma.$transaction(async (tx) => {
      const variable = await tx.variable.create({
        data: {
          environmentId,
          context,
          name,
          description,
          visibility,
          secret,
        },
      });

      await this.secretService.set(environmentId, variable.id, value);

      return variable;
    });
  }

  async updateVariable(
    environmentId: string,
    updatedBy: string,
    variable: Variable,
    name: string | undefined,
    context: string | undefined,
    description: string | undefined,
    value: ValueType | undefined,
    visibility: Visibility | undefined,
    secret: boolean | undefined,
  ): Promise<Variable> {
    name = name && this.commonService.sanitizeNameIdentifier(name);
    context = context && this.commonService.sanitizeContextIdentifier(context);

    if (!await this.checkContextAndNameDuplicates(environmentId, context ?? variable.context, name ?? variable.name, [variable.id])) {
      throw new ConflictException(`Variable with name '${name ?? variable.name}' and context '${context ?? variable.context}' already exists`);
    }

    description = description === '' && value
      ? (await this.aiService.getVariableDescription(name ?? variable.name, context ?? variable.context, secret ?? variable.secret, JSON.stringify(value))).description
      : description;

    return this.prisma.$transaction(async (tx) => {
      this.logger.debug(`Updating variable ${variable.id}`);
      const updatedVariable = await tx.variable.update({
        where: {
          id: variable.id,
        },
        data: {
          name: name || variable.name,
          context: context ?? variable.context,
          description: description ?? variable.description,
          visibility: visibility ?? variable.visibility,
          secret: secret ?? variable.secret,
        },
        include: {
          environment: true,
        },
      });

      if (value) {
        const previousValue = secret ?? variable.secret
          ? '********'
          : await this.getVariableValue(variable);

        this.logger.debug(`Updating variable ${variable.id} value`);
        await this.secretService.set(environmentId, variable.id, value);

        this.logger.debug(`Sending change event for variable ${variable.id}.`);
        this.eventService.sendVariableChangeEvent(variable.id, {
          type: 'update',
          previousValue,
          currentValue: secret ?? variable.secret ? '********' : value,
          updatedBy,
          updateTime: Date.now(),
        });
      }

      return updatedVariable;
    });
  }

  async deleteVariable(variable: Variable, deletedBy: string): Promise<void> {
    this.logger.debug(`Deleting variable ${variable.id}`);

    const functionsWithVariableArgument = await this.functionService.getFunctionsWithVariableArgument(`${variable.context}.${variable.name}`);
    if (functionsWithVariableArgument.length) {
      throw new ConflictException(
        `Variable cannot be deleted as it is used in function(s): ${functionsWithVariableArgument.map((f) => f.id).join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const deletedVariable = await tx.variable.delete({
        where: {
          id: variable.id,
        },
        include: {
          environment: true,
        },
      });

      const previousValue = variable.secret
        ? '********'
        : await this.getVariableValue(variable);

      await this.secretService.delete(deletedVariable.environment.id, variable.id);
      await this.eventService.sendVariableChangeEvent(variable.id, {
        type: 'delete',
        previousValue,
        currentValue: null,
        updatedBy: deletedBy,
        updateTime: Date.now(),
      });
    });
  }

  async toServerVariableSpecification(variable: Variable): Promise<ServerVariableSpecification> {
    const value = await this.secretService.get(variable.environmentId, variable.id);
    const [type, typeSchema] = await this.commonService.resolveType('ValueType', value);

    return {
      type: 'serverVariable',
      id: variable.id,
      name: variable.name,
      context: variable.context,
      description: variable.description,
      visibilityMetadata: {
        visibility: variable.visibility as Visibility,
      },
      variable: {
        environmentId: variable.environmentId,
        secret: variable.secret,
        valueType: variable.secret
          ? {
              kind: 'object',
            }
          : await this.commonService.toPropertyType(variable.name, type, value, typeSchema),
        value: variable.secret ? undefined : value,
      },
    };
  }

  async getContextVariableValues(environmentId: string, context: string | null): Promise<ContextVariableValues> {
    const variables = (await this.getAll(environmentId, context ? [context] : undefined, undefined, undefined, true))
      .filter(variable => !variable.secret);
    const contextValues = {} as ContextVariableValues;

    for (const variable of variables) {
      const subContext = variable.context.substring(context ? context.length + 1 : 0);
      if (subContext) {
        let subContextValues = get(contextValues, subContext);
        if (!subContextValues) {
          subContextValues = {};
          set(contextValues, subContext, subContextValues);
        }
        subContextValues[variable.name] = await this.getVariableValue(variable);
      } else {
        contextValues[variable.name] = await this.getVariableValue(variable);
      }
    }

    return contextValues;
  }

  async unwrapVariables<T extends Record<string, any>>(authData: AuthData, obj: T): Promise<T> {
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      if (typeof value === 'object' && value.type === 'PolyVariable' && value.id) {
        const variable = await this.findById(value.id);
        if (variable) {
          await this.authService.checkEnvironmentEntityAccess(variable, authData, true);
          obj[key as keyof T] = await this.getVariableValue(variable, value.path);
        }
      } else if (typeof value === 'object') {
        obj[key as keyof T] = await this.unwrapVariables(authData, value);
      }
    }
    return obj;
  }

  private async checkContextAndNameDuplicates(environmentId, context: string, name: string, excludedIds?: string[]) {
    // TODO: it's probably better check this via SpecService similar to how it's done in FunctionService
    // TODO: should be changed as part of #518 task
    const existingCount = await this.prisma.variable.count({
      where: {
        environmentId,
        context,
        name,
        id: {
          notIn: excludedIds,
        },
      },
    });

    return existingCount === 0;
  }
}
