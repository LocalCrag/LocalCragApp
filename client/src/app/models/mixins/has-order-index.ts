type Constructor = new (...args: any[]) => object;

export function HasOrderIndex<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    orderIndex: number;
  };
}

export type OrderIndexInstance = InstanceType<ReturnType<typeof HasOrderIndex>>;

export function deserializeOrderIndexAttributes(
  instance: OrderIndexInstance,
  payload: any,
): void {
  instance.orderIndex = payload.orderIndex;
}
