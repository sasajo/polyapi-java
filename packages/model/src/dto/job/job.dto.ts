import { FunctionsExecutionType, ScheduleType } from '../../job';
import { FunctionJob, ScheduleApiProperty } from './utils.dto';

export class Periodical {
  type: ScheduleType.PERIODICAL;
  value: string;
}

export class OnTime {
  type: ScheduleType.ON_TIME;
  value: Date;
}

export class Interval {
  type: ScheduleType.INTERVAL;
  value: number;
}

export type Schedule = Periodical | OnTime | Interval;

export class JobDto {
  id: string;

  name: string;

    @ScheduleApiProperty()
    schedule: Schedule;

    functions: FunctionJob[];

    functionsExecutionType: FunctionsExecutionType;

    nextExecutionAt: Date | null;

    environmentId: string;

    enabled: boolean;
}
