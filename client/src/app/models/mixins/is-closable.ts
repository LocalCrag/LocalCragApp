type Constructor = new (...args: any[]) => object;

export function IsClosable<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    closed: boolean;
    closedReason: string;
  };
}

type ClosableInstance = InstanceType<ReturnType<typeof IsClosable>>;

export function deserializeClosableAttributes(
  instance: ClosableInstance,
  payload: any,
): void {
  instance.closed = payload.closed;
  instance.closedReason = payload.closedReason;
}

export function serializeClosableAttributes(instance: ClosableInstance): any {
  return {
    closed: instance.closed,
    closedReason: instance.closedReason,
  };
}
