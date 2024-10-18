import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from '../../../environments/environment';
import * as fromInstanceSettings from '../reducers/instance-settings.reducers';
import * as fromAuth from '../reducers/auth.reducers';
import * as fromAppLevelAlerts from '../reducers/app-level-alerts.reducers';
import * as fromDevice from '../reducers/device.reducers';

/**
 * Declares the app state.
 */
export interface AppState {
  auth: fromAuth.AuthState;
  instanceSettings: fromInstanceSettings.InstanceSettingsState;
  device: fromDevice.DeviceState;
  appLevelAlerts: fromAppLevelAlerts.AppLevelAlertsState;
}

export const reducers: ActionReducerMap<AppState> = {
  auth: fromAuth.reducer,
  instanceSettings: fromInstanceSettings.reducer,
  device: fromDevice.reducer,
  appLevelAlerts: fromAppLevelAlerts.reducer,
};

export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? []
  : [];
