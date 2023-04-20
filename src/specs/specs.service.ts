import { Injectable, Logger } from '@nestjs/common';
import { FunctionService } from 'function/function.service';
import { WebhookService } from 'webhook/webhook.service';
import { AuthProviderService } from 'auth-provider/auth-provider.service';
import { User } from '@prisma/client';
import { Specification } from '@poly/common';

@Injectable()
export class SpecsService {
  private logger: Logger = new Logger(SpecsService.name);

  constructor(
    private readonly functionService: FunctionService,
    private readonly webhookService: WebhookService,
    private readonly authProviderService: AuthProviderService,
  ) {
  }

  async getSpecifications(user: User, contexts?: string[], names?: string[], ids?: string[]): Promise<Specification[]> {
    const apiFunctions = await this.functionService.getUrlFunctionsByUser(user, contexts, names, ids);
    const customFunctions = await this.functionService.getCustomFunctionsByUser(user, contexts, names, ids);
    const webhookHandles = await this.webhookService.getWebhookHandles(user);
    const authProviders = await this.authProviderService.getAuthProviders(user, contexts);

    return [
      ...(await Promise.all(apiFunctions.map(apiFunction => this.functionService.toApiFunctionSpecification(apiFunction)))),
      ...(await Promise.all(customFunctions.map(customFunction => this.functionService.toCustomFunctionSpecification(customFunction)))),
      ...(await Promise.all(webhookHandles.map(webhookHandle => this.webhookService.toWebhookHandleSpecification(webhookHandle)))),
      ...(await Promise.all(authProviders.map(authProvider => this.authProviderService.toAuthFunctionSpecifications(authProvider)))).flat(),
    ];
  }
}
