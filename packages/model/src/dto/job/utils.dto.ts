import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Validate, ValidationArguments } from 'class-validator';
import { CronExpression, Record } from '../validators';
import { ScheduleType } from '../../job';

const dateErrMsg = (validationArgs: ValidationArguments) => `${validationArgs.property} must be a valid ISO 8601 date string`;

export class ScheduleBase {
    @IsString()
    @IsIn([ScheduleType.INTERVAL, ScheduleType.PERIODICAL, ScheduleType.ON_TIME])
    type: ScheduleType;
}

export class OnTime extends ScheduleBase {
    @IsString()
    @ApiProperty({
      enum: [ScheduleType.ON_TIME],
    })
    type: ScheduleType.ON_TIME;

    /**
     * Valid ISO 8601 date string, you can create your dates with this tool: https://www.timestamp-converter.com/
     */
    @IsDate({
      message: dateErrMsg,
    })
    @Type(() => Date)
    value: Date;
}

export class Periodical extends ScheduleBase {
    @IsString()
    @ApiProperty({
      enum: [ScheduleType.PERIODICAL],
    })
    type: ScheduleType.PERIODICAL;

    /**
     * You can try your cron expressions here: https://crontab.guru
     */
    @IsString()
    @IsNotEmpty()
    @Validate(CronExpression)
    value: string;
}

export class Interval extends ScheduleBase {
    @ApiProperty({
      enum: [ScheduleType.INTERVAL],
    })
    @IsString()
    type: ScheduleType.INTERVAL;

    /**
     * The interval in minutes.
     */
    @IsNumber()
    value: number;
}

export class FunctionJob {
    @IsString()
    @IsNotEmpty()
    id: string;

    @IsOptional()
    @IsObject()
    @Record({ apiProperty: { required: false } })
    eventPayload: object;

    @IsOptional()
    @Record({ apiProperty: { required: false } })
    headersPayload: object;

    @IsOptional()
    @Record({ apiProperty: { required: false } })
    paramsPayload: object;
}

export const ScheduleApiProperty = ({ required }: { required?: boolean } = { required: true }) => applyDecorators(ApiProperty({
  name: 'schedule',
  oneOf: [
    {
      $ref: getSchemaPath(Periodical),
    },
    {
      $ref: getSchemaPath(Interval),
    },
    {
      $ref: getSchemaPath(OnTime),
    },
  ],
  required,
}));
