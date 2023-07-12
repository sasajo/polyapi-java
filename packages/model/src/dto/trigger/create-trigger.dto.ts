import { IsNotEmpty } from 'class-validator';
import { IsOnlyOneOfDefined } from '../validators';
import { TriggerDestination, TriggerSource } from './trigger.dto';

export class CreateTriggerDto {
  @IsNotEmpty()
  @IsOnlyOneOfDefined(['webhookHandleId', 'serverFunctionId'])
  source: TriggerSource;

  @IsNotEmpty()
  @IsOnlyOneOfDefined(['serverFunctionId'])
  destination: TriggerDestination;
}
