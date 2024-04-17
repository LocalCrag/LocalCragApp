import {createAction, props} from '@ngrx/store';

export const clearGradeCache = createAction(
  '[Cache] Clear grade cache',
  props<{ area: string, sector: string, crag: string }>()
);

export const clearAscentCache = createAction(
  '[Cache] Clear ascent cache',
  props<{ area: string, sector: string, crag: string, line: string, user: string }>()
);

