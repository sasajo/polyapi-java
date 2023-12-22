import { FunctionsExecutionType, JobExecutionStatus } from '../../job';
import { Schedule } from './job.dto';

export type ExecutionDto = {
    id: string;
    jobId: string;
    processedOn: Date | null;
    finishedOn: Date | null;
    duration: number | null;
    functions: { id: string; invocation: { headersPayload: object; eventPayload: object; paramsPayload: object }, response: { statusCode?: number, fatalError: boolean }}[]
    type: FunctionsExecutionType
    status: JobExecutionStatus
    schedule: Schedule
}
