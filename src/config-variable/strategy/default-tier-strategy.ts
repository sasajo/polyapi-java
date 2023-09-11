import { ConfigVariableStrategy } from 'config-variable/strategy/base';
import { ConfigVariable } from '@prisma/client';
import { DefaultTierValue } from '@poly/model';
import { BadRequestException, ForbiddenException } from '@nestjs/common';

export class DefaultTierStrategy extends ConfigVariableStrategy<DefaultTierValue> {
  async configure(name: string, value: unknown, tenantId: string | null, environmentId: string | null): Promise<ConfigVariable> {
    if (tenantId !== null || environmentId !== null) {
      throw new ForbiddenException('DefaultTier config variable can only be set at the instance level');
    }

    const { tierId } = value as DefaultTierValue;
    if (tierId) {
      const limitTier = await this.prisma.limitTier.findFirst({
        where: {
          id: tierId,
        },
      });
      if (!limitTier) {
        throw new BadRequestException('Tier with given id does not exist');
      }
    }

    const configVariable = await this.prisma.configVariable.findFirst({
      where: {
        name,
        tenantId: null,
        environmentId: null,
      },
    });

    if (configVariable) {
      return this.updateById(configVariable.id, value);
    } else {
      return this.create({ name, value, tenantId, environmentId });
    }
  }

  getOneFromList(configVariables: ConfigVariable[]): ConfigVariable | null {
    // there should be only instance level one
    return configVariables[0];
  }
}
