import { IsArray, IsBoolean, IsEnum, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleBase, Interval, Periodical, OnTime, FunctionJob, ScheduleApiProperty } from './utils.dto';
import { FunctionsExecutionType, ScheduleType } from '../../job';

export class UpdateJobDto {
    @IsString()
    @IsOptional()
    name?: string;

    @ScheduleApiProperty({ required: false })
    @IsOptional()
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
    schedule?: Interval | Periodical | OnTime;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => FunctionJob)
    functions?: FunctionJob[];

    @IsOptional()
    @IsEnum(FunctionsExecutionType)
    executionType?: FunctionsExecutionType;

    @IsOptional()
    @IsBoolean()
    enabled?: boolean | undefined;
}
