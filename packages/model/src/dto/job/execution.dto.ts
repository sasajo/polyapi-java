import { FunctionsExecutionType, JobExecutionStatus } from '../../job';
import { Schedule } from './job.dto';
import { ScheduleApiProperty } from './utils.dto';

class FunctionExecutionResponse {
  statusCode?: number;
  fatalError: boolean;
}

class Invocation {
  headersPayload: object;
  eventPayload: object;
  paramsPayload: object;
}

class FunctionExecutionInfo {
  id: string;
  invocation: Invocation;
  response: FunctionExecutionResponse;
}

export class ExecutionDto {
  id: string;
  jobId: string;
  processedOn: Date | null;
  finishedOn: Date | null;
  duration: number | null;
  functions: FunctionExecutionInfo[];
  type: FunctionsExecutionType;
  status: JobExecutionStatus;
    @ScheduleApiProperty()
    schedule: Schedule;
}
