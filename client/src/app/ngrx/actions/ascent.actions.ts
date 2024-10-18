import { createAction, props } from '@ngrx/store';
import { User } from '../../models/user';

export const reloadAfterAscent = createAction(
  '[Ascents] Reload after ascent',
  props<{ ascendedLineId: string }>(),
);
