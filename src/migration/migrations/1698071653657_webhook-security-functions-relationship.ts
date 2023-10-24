import { MigrationContext } from 'migration/types';
import { WebhookSecurityFunction } from '../../../packages/model/src/dto';

export const run = async ({ prisma }: MigrationContext): Promise<void> => {
  const webhookHandles = await prisma.webhookHandle.findMany({
    where: {
      NOT: {
        securityFunctions: {
          equals: null,
        },
      },
    },
  });

  for (const webhookHandle of webhookHandles) {
    if (!webhookHandle.securityFunctions) {
      continue;
    }
    const securityFunctionIds = JSON.parse(webhookHandle.securityFunctions) as WebhookSecurityFunction[];

    for (const securityFunction of securityFunctionIds) {
      const customFunction = await prisma.customFunction.findFirst({
        where: {
          id: securityFunction.id,
        },
      });

      if (!customFunction) {
        continue;
      }

      await prisma.customFunctionWebhookHandle.create({
        data: {
          custom_function_id: customFunction.id,
          webhook_handle_id: webhookHandle.id,
          message: securityFunction.message,
        },
      });
    }
  }
};
