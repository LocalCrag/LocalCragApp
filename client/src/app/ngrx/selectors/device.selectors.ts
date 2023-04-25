import {createFeatureSelector, createSelector} from '@ngrx/store';
import {DeviceState} from '../reducers/device.reducers';

export const selectDeviceState = createFeatureSelector<DeviceState>('device');

export const selectIsMobile = createSelector(
  selectDeviceState,
  deviceState => deviceState.isMobile
);
