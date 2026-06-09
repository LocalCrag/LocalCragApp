import { ClosureSchedule } from '../closure-schedule';

type Constructor = new (...args: any[]) => object;

export function IsClosable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    closed: boolean;
    closedReason: string | null;
    closureSchedules: ClosureSchedule[];
  };
}

export type ClosableInstance = InstanceType<ReturnType<typeof IsClosable>>;

export function deserializeClosableAttributes(
  instance: ClosableInstance,
  payload: any,
): void {
  instance.closed = payload.closed;
  instance.closedReason = payload.closedReason ?? null;
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
