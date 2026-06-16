import { ClosureSchedule } from '../closure-schedule';
import {
  ClosureReasonAlert,
  deserializeClosureReasonAlerts,
} from '../closure-reason-alert';

type Constructor = new (...args: any[]) => object;

export function IsClosable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    closed: boolean;
    closureIsPermanent: boolean;
    closedReasons: ClosureReasonAlert[];
    upcomingClosureWarnings: ClosureReasonAlert[];
    closureSchedules: ClosureSchedule[];
  };
}

export type ClosableInstance = InstanceType<ReturnType<typeof IsClosable>>;

export function deserializeClosableAttributes(
  instance: ClosableInstance,
  payload: any,
): void {
  instance.closed = payload.closed;
  instance.closureIsPermanent = payload.closureIsPermanent ?? false;
  instance.closedReasons = deserializeClosureReasonAlerts(
    payload.closedReasons ?? [],
  );
  instance.upcomingClosureWarnings = deserializeClosureReasonAlerts(
    payload.upcomingClosureWarnings ?? [],
  );
  instance.closureSchedules = (payload.closureSchedules ?? []).map(
    ClosureSchedule.deserialize,
  );
}

export function serializeClosableAttributes(instance: ClosableInstance): any {
  return {
    closureSchedules: (instance.closureSchedules ?? []).map(
      ClosureSchedule.serialize,
    ),
  };
}
