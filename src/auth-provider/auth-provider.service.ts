import crypto from 'crypto';
import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthProvider, AuthToken, User } from '@prisma/client';
import { catchError, lastValueFrom, map, of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from 'prisma/prisma.service';
import {
  AuthFunctionSpecification,
  AuthProviderDto,
  ExecuteAuthProviderResponseDto,
  PropertySpecification,
} from '@poly/common';
import { ConfigService } from 'config/config.service';
import { EventService } from 'event/event.service';
import { AxiosError } from 'axios';
import { SpecsService } from 'specs/specs.service';

@Injectable()
export class AuthProviderService {
  private logger = new Logger(AuthProviderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    private readonly eventService: EventService,
    @Inject(forwardRef(() => SpecsService))
    private readonly specsService: SpecsService,
  ) {
  }

  async getAuthProviders(user: User, contexts?: string[]): Promise<AuthProvider[]> {
    const contextConditions = contexts?.length
      ? contexts.filter(Boolean).map((context) => {
        return {
          OR: [
            {
              context: { startsWith: `${context}.` },
            },
            {
              context,
            },
          ],
        };
      })
      : [];

    return this.prisma.authProvider.findMany({
      where: {
        userId: user.id,
        ...contextConditions.length && {
          OR: contextConditions,
        },
      },
    });
  }

  async getAuthProvider(user: User, id: string): Promise<AuthProvider | null> {
    return this.prisma.authProvider.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });
  }

  async createAuthProvider(user: User, context: string, authorizeUrl: string, tokenUrl: string, revokeUrl: string | null, introspectUrl: string | null, audienceRequired: boolean) {
    if (!await this.checkContextDuplicates(user, context, !!revokeUrl, !!introspectUrl)) {
      throw new ConflictException(`Auth functions within context ${context} already exist`);
    }

    this.logger.debug(`Creating auth provider for user ${user.id} with context ${context} and authorizeUrl ${authorizeUrl}`);
    return this.prisma.authProvider.create({
      data: {
        context,
        authorizeUrl,
        tokenUrl,
        revokeUrl,
        introspectUrl,
        audienceRequired,
        user: {
          connect: {
            id: user.id,
          },
        },
      },
    });
  }

  async updateAuthProvider(
    user: User,
    authProvider: AuthProvider,
    context: string | undefined,
    authorizeUrl: string | undefined,
    tokenUrl: string | undefined,
    revokeUrl: string | null | undefined,
    introspectUrl: string | null | undefined,
    audienceRequired: boolean | undefined
  ) {
    context = context || authProvider.context;
    authorizeUrl = authorizeUrl || authProvider.authorizeUrl;
    tokenUrl = tokenUrl || authProvider.tokenUrl;
    revokeUrl = revokeUrl === undefined ? authProvider.revokeUrl : revokeUrl;
    introspectUrl = introspectUrl === undefined ? authProvider.introspectUrl : introspectUrl;
    audienceRequired = audienceRequired === undefined ? authProvider.audienceRequired : audienceRequired;

    if (!await this.checkContextDuplicates(user, context, !!revokeUrl, !!introspectUrl, [authProvider.id])) {
      throw new ConflictException(`Auth functions within context ${context} already exist`);
    }

    this.logger.debug(`Updating auth provider ${authProvider.id} for user ${user.id}`);
    return this.prisma.authProvider.update({
      where: {
        id: authProvider.id,
      },
      data: {
        context,
        authorizeUrl,
        tokenUrl,
        revokeUrl,
        introspectUrl,
        audienceRequired,
      },
    });
  }

  async deleteAuthProvider(user, authProvider: AuthProvider) {
    this.logger.debug(`Deleting auth provider ${authProvider.id} for user ${user.id}`);
    return this.prisma.authProvider.delete({
      where: {
        id: authProvider.id,
      },
    });
  }

  toAuthProviderDto(authProvider: AuthProvider): AuthProviderDto {
    return {
      id: authProvider.id,
      context: authProvider.context,
      authorizeUrl: authProvider.authorizeUrl,
      tokenUrl: authProvider.tokenUrl,
      audienceRequired: authProvider.audienceRequired,
      revokeUrl: authProvider.revokeUrl,
      introspectUrl: authProvider.introspectUrl,
      callbackUrl: this.getAuthProviderCallbackUrl(authProvider),
    };
  }

  public async executeAuthProvider(user: User, authProvider: AuthProvider, eventsClientId: string, clientId: string, clientSecret: string, audience: string | null, scopes: string[], callbackUrl: string | null): Promise<ExecuteAuthProviderResponseDto> {
    await this.prisma.authToken.deleteMany({
      where: {
        authProvider: {
          id: authProvider.id,
        },
        user: {
          id: user.id,
        },
        clientId,
        clientSecret,
      },
    });

    const state = crypto.randomBytes(20).toString('hex');
    const authToken = await this.prisma.authToken.create({
      data: {
        user: {
          connect: {
            id: user.id,
          },
        },
        authProvider: {
          connect: {
            id: authProvider.id,
          },
        },
        clientId,
        clientSecret,
        audience,
        scopes: scopes.join(' '),
        state,
        callbackUrl,
        eventsClientId,
      },
    });

    return {
      url: this.getAuthProviderAuthorizationUrl(authProvider, authToken),
    };
  }

  private getAuthProviderAuthorizationUrl(authFunction: AuthProvider, authToken: AuthToken) {
    const params = new URLSearchParams({
      client_id: authToken.clientId,
      redirect_uri: this.getAuthProviderCallbackUrl(authFunction),
      response_type: 'code',
    });

    if (authToken.state) {
      params.append('state', authToken.state);
    }
    if (authToken.scopes) {
      params.append('scope', authToken.scopes);
    }
    if (authToken.audience) {
      params.append('audience', authToken.audience);
    }

    return `${authFunction.authorizeUrl}?${params.toString()}`;
  }

  private getAuthProviderCallbackUrl(authProvider: AuthProvider) {
    return `${this.config.hostUrl}/auth-providers/${authProvider.id}/callback`;
  }

  async processAuthProviderCallback(id: string, query: any): Promise<string | null> {
    const { state, error, code } = query;
    if (!state) {
      this.logger.error('Missing state for auth provider callback');
      throw new BadRequestException('Missing state');
    }

    const authToken = await this.prisma.authToken.findFirst({
      where: {
        state,
      },
    });
    if (!authToken) {
      this.logger.error(`Cannot find auth token for state: ${state}`);
      throw new BadRequestException('Invalid state');
    }

    const authProvider = await this.prisma.authProvider.findFirst({
      where: {
        id,
      },
    });
    if (!authProvider) {
      this.logger.error(`Cannot find auth provider for id: ${id}`);
      throw new BadRequestException('Invalid id');
    }

    if (error) {
      this.logger.debug(`Auth function callback error: ${error}`);
      this.eventService.sendAuthFunctionEvent(id, {
        error,
      });
      return null;
    }

    if (!code) {
      this.logger.error('Missing code for auth function callback');
      throw new BadRequestException('Missing code');
    }

    const tokenData = await lastValueFrom(
      this.httpService
        .request({
          url: authProvider.tokenUrl,
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          data: {
            code,
            client_id: authToken.clientId,
            client_secret: authToken.clientSecret,
            audience: authToken.audience,
            grant_type: 'authorization_code',
            redirect_uri: this.getAuthProviderCallbackUrl(authProvider),
          },
        })
        .pipe(
          map((response) => response.data),
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Error while performing token request for auth function (id: ${authProvider.id}): ${error}`);

            this.eventService.sendAuthFunctionEvent(id, {
              url: this.getAuthProviderAuthorizationUrl(authProvider, authToken),
              error: error.response ? error.response.data : error.message,
            });

            return of(null);
          }),
        ),
    );
    if (!tokenData) {
      return null;
    }

    this.logger.debug(`Received token data for auth function ${authProvider.id}: ${JSON.stringify(tokenData)}`);

    const updatedAuthToken = await this.prisma.authToken.update({
      where: {
        id: authToken.id,
      },
      data: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        state: crypto.randomBytes(20).toString('hex'),
      },
    });

    this.eventService.sendAuthFunctionEvent(id, {
      token: tokenData.access_token,
      url: this.getAuthProviderAuthorizationUrl(authProvider, updatedAuthToken),
    });

    return updatedAuthToken.callbackUrl;
  }

  async revokeAuthToken(user: User, authProvider: AuthProvider, token: string) {
    if (!authProvider.revokeUrl) {
      return;
    }

    this.logger.debug(`Revoking auth token for provider ${authProvider.id}...`);
    const authToken = await this.prisma.authToken.findFirst({
      where: {
        authProvider: {
          id: authProvider.id,
        },
        user: {
          id: user.id,
        },
        OR: [
          {
            accessToken: token,
          },
          {
            refreshToken: token,
          },
        ],
      },
    });
    if (authToken) {
      await this.prisma.authToken.delete({
        where: {
          id: authToken.id,
        },
      });
    }

    if (!authToken?.accessToken) {
      this.logger.debug(`No auth token found for auth function ${authProvider.id}`);
      return;
    }
    await this.httpService
      .request({
        url: authProvider.revokeUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          client_id: authToken.clientId,
          client_secret: authToken.clientSecret,
          token: authToken.accessToken,
        },
      })
      .pipe(
        catchError((error: AxiosError) => {
          this.logger.error(`Error while performing token revoke for auth function (id: ${authProvider.id}): ${error}`);
          throw new InternalServerErrorException(error.response?.data || error.message);
        }),
      );
  }

  async introspectAuthToken(user: User, authProvider: AuthProvider, token: string): Promise<any> {
    if (!authProvider.introspectUrl) {
      return;
    }

    this.logger.debug(`Introspecting auth token for provider ${authProvider.id}...`);
    const authToken = await this.prisma.authToken.findFirst({
      where: {
        authProvider: {
          id: authProvider.id,
        },
        user: {
          id: user.id,
        },
        accessToken: token,
      },
    });
    if (!authToken?.accessToken) {
      this.logger.debug(`No auth token found for auth function ${authProvider.id}`);
      return;
    }
    return lastValueFrom(
      await this.httpService
        .request({
          url: authProvider.introspectUrl,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          data: {
            token: authToken.accessToken,
          },
        })
        .pipe(
          map((response) => {
            this.logger.debug(`Received introspection data for auth function ${authProvider.id}: ${JSON.stringify(response.data)}`);
            return response.data;
          }),
        )
        .pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`Error while performing token introspection for auth function (id: ${authProvider.id}): ${error}`);
            throw new InternalServerErrorException(error.response?.data || error.message);
          }),
        ),
    );
  }

  async toAuthFunctionSpecifications(authProvider: AuthProvider): Promise<AuthFunctionSpecification[]> {
    const specifications: AuthFunctionSpecification[] = [];

    specifications.push({
      type: 'authFunction',
      id: authProvider.id,
      context: authProvider.context,
      name: 'getToken',
      function: {
        arguments: this.getGetTokenFunctionArguments(authProvider),
        returnType: {
          kind: 'void',
        },
      },
    });
    if (authProvider.introspectUrl) {
      specifications.push({
        type: 'authFunction',
        id: authProvider.id,
        context: authProvider.context,
        name: 'introspectToken',
        function: {
          arguments: [{
            name: 'token',
            required: true,
            type: {
              kind: 'primitive',
              type: 'string',
            },
          }],
          returnType: {
            kind: 'object',
          },
        },
        subResource: 'introspect',
      });
    }
    if (authProvider.revokeUrl) {
      specifications.push({
        type: 'authFunction',
        id: authProvider.id,
        context: authProvider.context,
        name: 'revokeToken',
        function: {
          arguments: [{
            name: 'token',
            required: true,
            type: {
              kind: 'primitive',
              type: 'string',
            },
          }],
          returnType: {
            kind: 'void',
          },
        },
        subResource: 'revoke',
      });
    }

    return specifications;
  }

  private getGetTokenFunctionArguments(authProvider: AuthProvider): PropertySpecification[] {
    return [
      {
        name: 'clientId',
        required: true,
        type: {
          kind: 'primitive',
          type: 'string',
        },
      },
      {
        name: 'clientSecret',
        required: true,
        type: {
          kind: 'primitive',
          type: 'string',
        },
      },
      authProvider.audienceRequired
        ? {
          name: 'audience',
          required: true,
          type: {
            kind: 'primitive',
            type: 'string',
          },
        }
        : undefined,
      {
        name: 'scopes',
        required: true,
        type: {
          kind: 'array',
          items: {
            kind: 'primitive',
            type: 'string',
          },
        },
      },
      {
        name: 'callback',
        required: true,
        type: {
          kind: 'function',
          name: 'AuthFunctionCallback',
          spec: {
            arguments: [
              {
                name: 'token',
                required: false,
                nullable: true,
                type: {
                  kind: 'primitive',
                  type: 'string',
                },
              },
              {
                name: 'url',
                required: false,
                type: {
                  kind: 'primitive',
                  type: 'string',
                },
              },
              {
                name: 'error',
                required: false,
                nullable: true,
                type: {
                  kind: 'primitive',
                  type: 'object',
                },
              },
            ],
            returnType: {
              kind: 'void',
            },
            synchronous: true,
          },
        },
      },
      {
        name: 'options',
        required: false,
        type: {
          kind: 'object',
          properties: [
            {
              name: 'callbackUrl',
              required: false,
              type: {
                kind: 'primitive',
                type: 'string',
              },
            },
            {
              name: 'timeout',
              required: false,
              type: {
                kind: 'primitive',
                type: 'number',
              },
            },
            {
              name: 'audience',
              required: false,
              type: {
                kind: 'primitive',
                type: 'string',
              },
            },
          ],
        },
      },
    ].filter(Boolean) as PropertySpecification[];
  }

  private async checkContextDuplicates(user: User, context: string, revokeFunction: boolean, introspectFunction: boolean, excludedIds?: string[]): Promise<boolean> {
    const paths = (await this.specsService.getSpecificationPaths(user))
      .filter(path => excludedIds == null || !excludedIds.includes(path.id))
      .map(path => path.path);

    if (paths.includes(`${context}.getToken`)) {
      return false;
    }
    if (revokeFunction && paths.includes(`${context}.revokeToken`)) {
      return false;
    }
    if (introspectFunction && paths.includes(`${context}.introspectToken`)) {
      return false;
    }

    return true;
  }
}
