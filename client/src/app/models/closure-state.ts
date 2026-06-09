export class ClosureState {
  closed: boolean;
  closedReason: string | null;

  static deserialize(payload: any): ClosureState {
    const state = new ClosureState();
    state.closed = payload.closed ?? false;
    state.closedReason = payload.closedReason ?? null;
    return state;
  }
}
