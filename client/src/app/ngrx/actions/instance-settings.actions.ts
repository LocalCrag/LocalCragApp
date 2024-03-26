import {createAction, props} from '@ngrx/store';
import {LoginResponse} from '../../models/login-response';
import {InstanceSettings} from '../../models/instance-settings';


export const updateInstanceSettings = createAction(
  '[Instance settings] Update instance settings',
  props<{ settings: InstanceSettings }>()
);

