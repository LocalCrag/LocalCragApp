import * as DeviceActions from './../actions/device.actions';
import { Action, createReducer, on } from '@ngrx/store';

/**
 * The state for device detection properties.
 */
export interface DeviceState {
  isMobile: boolean;
}

export const initialDeviceState: DeviceState = {
  isMobile: false,
};

const deviceStateReducer = createReducer(
  initialDeviceState,
  on(DeviceActions.setIsMobile, (state, action) => ({
    ...state,
    isMobile: action.isMobile,
  })),
);

/**
 * Reducer for device actions.
 *
 * @param state Input state.
 * @param action Input action.
 */
export const reducer = (state: DeviceState | undefined, action: Action) =>
  deviceStateReducer(state, action);
