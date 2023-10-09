import { TriggerDestination, TriggerDto, TriggerSource } from '@poly/model';

export interface TriggerProvider {
  init: () => Promise<void>;
  findTriggerById: (environmentId: string, id: string) => Promise<TriggerDto | null>;
  getTriggers: (environmentId?: string) => Promise<TriggerDto[]>;
  createTrigger: (
    environmentId: string,
    name: string | null,
    source: TriggerSource,
    destination: TriggerDestination,
    waitForResponse: boolean
  ) => Promise<TriggerDto>;
  updateTrigger: (
    environmentId: string,
    trigger: TriggerDto,
    name: string | null | undefined,
    waitForResponse: boolean | undefined,
  ) => Promise<TriggerDto>;
  deleteTrigger: (environmentId: string, trigger: TriggerDto) => Promise<void>;
  triggerEvent: (environmentId: string, executionId: string, source: TriggerSource, data: any) => Promise<void>;
}
