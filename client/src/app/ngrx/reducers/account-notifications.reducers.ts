import { createReducer, on } from '@ngrx/store';
import * as AuthActions from '../actions/auth.actions';
import { loadUnreadNotificationCountSuccess } from '../actions/notifications.actions';

export interface AccountNotificationsState {
  unreadCount: number;
}

export const initialState: AccountNotificationsState = {
  unreadCount: 0,
};

export const reducer = createReducer(
  initialState,
  on(loadUnreadNotificationCountSuccess, (state, { count }) => ({
    ...state,
    unreadCount: count,
  })),
  on(AuthActions.cleanupCredentials, () => ({ ...initialState })),
);
