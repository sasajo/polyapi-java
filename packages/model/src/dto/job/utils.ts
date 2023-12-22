import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsIn, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Validate, ValidationArguments } from 'class-validator';
import { CronExpression, Record } from '../validators';
import { ScheduleType } from '../../job';

const dateErrMsg = (validationArgs: ValidationArguments) => `${validationArgs.property} must be a valid ISO 8601 date string`;

export class ScheduleBase {
    @ApiProperty({
      name: 'type',
    })
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

    @IsDate({
      message: dateErrMsg,
    })
    @ApiProperty()
    @Type(() => Date)
    value: Date;
}

export class Periodical extends ScheduleBase {
    @IsString()
    @ApiProperty({
      enum: [ScheduleType.PERIODICAL],
    })
    type: ScheduleType.PERIODICAL;

    @IsString()
    @IsNotEmpty()
    @Validate(CronExpression)
    @ApiProperty({
      description: 'You can try your cron expressions here: https://crontab.guru/#*_*_*_*_*',
    })
    value: string;
}

export class Interval extends ScheduleBase {
    @IsString()
    @ApiProperty({
      name: 'type',
      enum: [ScheduleType.INTERVAL],
    })
    type: ScheduleType.INTERVAL;

    @IsNumber()
    @ApiProperty()
    value: number;
}

export class CreateFunctionJob {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    id: string;

    @ApiProperty({
      required: false,
      type: 'object',
      additionalProperties: {
        description: 'Can be anything',
      },
    })
    @IsOptional()
    @IsObject()
    eventPayload?: object;

    @ApiProperty({
      required: false,
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    })
    @IsOptional()
    @Record()
    headersPayload?: object;

    @ApiProperty({
      required: false,
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    })
    @IsOptional()
    @Record()
    paramsPayload?: object;
}
