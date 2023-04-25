import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from '../../../environments/environment';
import * as fromAuth from '../reducers/auth.reducers';
import * as fromAppLevelAlerts from '../reducers/app-level-alerts.reducers';
import * as fromDevice from '../reducers/device.reducers';


/**
 * Declares the app state.
 */
export interface AppState {
  auth: fromAuth.AuthState;
  device: fromDevice.DeviceState;
  appLevelAlerts: fromAppLevelAlerts.AppLevelAlertsState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: fromAuth.reducer,
  device: fromDevice.reducer,
  appLevelAlerts: fromAppLevelAlerts.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production ? [] : [];
