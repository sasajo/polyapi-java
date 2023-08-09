import { ConflictException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from 'config/config.service';
import { TriggerProvider } from 'trigger/provider/trigger-provider';
import { KNativeTriggerProvider } from 'trigger/provider/knative-trigger-provider';
import { TriggerDestination, TriggerDto, TriggerSource } from '@poly/model';

@Injectable()
export class TriggerService implements OnModuleInit {
  private readonly logger = new Logger(TriggerService.name);
  private readonly triggerProvider: TriggerProvider;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly config: ConfigService,
  ) {
    this.triggerProvider = new KNativeTriggerProvider(cacheManager, config);
  }

  async onModuleInit() {
    await this.triggerProvider.init();
  }

  async findById(environmentId: string, triggerId: string) {
    return await this.triggerProvider.findTriggerById(environmentId, triggerId);
  }

  async getTriggers(environmentId: string) {
    return await this.triggerProvider.getTriggers(environmentId);
  }

  async createTrigger(environmentId: string, source: TriggerSource, destination: TriggerDestination) {
    try {
      return await this.triggerProvider.createTrigger(environmentId, source, destination);
    } catch (e) {
      if (e.message.includes('already exists')) {
        throw new ConflictException('Trigger with given source and destination already exists');
      } else {
        throw e;
      }
    }
  }

  async deleteTrigger(environmentId: string, trigger: TriggerDto) {
    return await this.triggerProvider.deleteTrigger(environmentId, trigger);
  }

  async triggerWebhookEvent(webhookHandleId: string, eventPayload: any) {
    return this.triggerProvider.triggerEvent({
      webhookHandleId,
    }, eventPayload);
  }
}
