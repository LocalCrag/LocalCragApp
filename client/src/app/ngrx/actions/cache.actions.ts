import {createAction, props} from '@ngrx/store';
import {LoginResponse} from '../../models/login-response';

export const clearGradeCache = createAction(
  '[Cache] Clear grade cache',
  props<{ area: string, sector: string, crag: string }>()
);

