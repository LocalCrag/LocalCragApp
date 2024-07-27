import {createAction, props} from '@ngrx/store';

export const todoAdded = createAction(
  '[Todos] Todo added',
  props<{ todoLineId: string }>()
);
