import {
  ClosureReasonAlert,
  deserializeClosureReasonAlerts,
} from './closure-reason-alert';

export class ClosureState {
  closed: boolean;
  closureIsPermanent: boolean;
  closedReasons: ClosureReasonAlert[];

  static deserialize(payload: any): ClosureState {
    const state = new ClosureState();
    state.closed = payload.closed ?? false;
    state.closureIsPermanent = payload.closureIsPermanent ?? false;
    state.closedReasons = deserializeClosureReasonAlerts(
      payload.closedReasons ?? [],
    );
    return state;
  }
}
