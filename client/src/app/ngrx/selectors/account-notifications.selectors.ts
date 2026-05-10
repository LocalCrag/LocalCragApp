import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AccountNotificationsState } from '../reducers/account-notifications.reducers';

export const selectAccountNotificationsState =
  createFeatureSelector<AccountNotificationsState>('accountNotifications');

export const selectUnreadNotificationCount = createSelector(
  selectAccountNotificationsState,
  (state) => state.unreadCount,
);
