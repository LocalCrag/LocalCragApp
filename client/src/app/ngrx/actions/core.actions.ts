import {createAction, props} from '@ngrx/store';
import {File} from '../../models/file';

export const reloadMenus = createAction(
  '[Core] Reload menus'
);
