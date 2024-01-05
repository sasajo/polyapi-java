import { IsEnum, IsOptional } from 'class-validator';
import { JobExecutionStatus } from '../../job';

export class ExecutionFiltersDto {
    @IsOptional()
    @IsEnum(JobExecutionStatus)
    status?: JobExecutionStatus;
}
