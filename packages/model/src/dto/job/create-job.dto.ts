import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { ScheduleType, FunctionsExecutionType } from '../../job';
import { Type } from 'class-transformer';

import { OnTime, Periodical, Interval, FunctionJob, ScheduleBase, ScheduleApiProperty } from './utils.dto';
import { ApiExtraModels, PartialType } from '@nestjs/swagger';

export { FunctionJob } from './utils.dto';

export class CreateFunctionJob extends PartialType(FunctionJob) {
  @IsString()
  @IsNotEmpty()
  id: string;
}

@ApiExtraModels(Interval, Periodical, OnTime)
export class CreateJobDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @ScheduleApiProperty({
      required: false,
    })
    @IsObject()
    @ValidateNested()
    @Type(() => ScheduleBase, {
      keepDiscriminatorProperty: true,
      discriminator: {
        property: 'type',
        subTypes: [
          {
            value: Interval,
            name: ScheduleType.INTERVAL,
          }, {
            value: Periodical,
            name: ScheduleType.PERIODICAL,
          }, {
            value: OnTime,
            name: ScheduleType.ON_TIME,
          },
        ],
      },
    })
    schedule: Interval | Periodical | OnTime;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateFunctionJob)
    functions: CreateFunctionJob[];

    @IsEnum(FunctionsExecutionType)
    executionType: FunctionsExecutionType;

    @IsOptional()
    @IsBoolean()
    enabled: boolean | undefined;
}
