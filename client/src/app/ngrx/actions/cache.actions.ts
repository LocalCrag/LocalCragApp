import {createAction, props} from '@ngrx/store';

export const clearGradeCache = createAction(
  '[Cache] Clear grade cache',
  props<{ area: string, sector: string, crag: string }>()
);

