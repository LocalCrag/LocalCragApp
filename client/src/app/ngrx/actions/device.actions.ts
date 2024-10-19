import {createAction, props} from '@ngrx/store';

export const checkIsMobile = createAction('[Device] Check is mobile state');

export const setIsMobile = createAction(
  '[Device] Set is mobile state',
  props<{ isMobile: boolean }>(),
);
