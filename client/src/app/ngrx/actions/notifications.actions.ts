import { createAction, props } from '@ngrx/store';
import { NotificationKey } from '../../utility/notifications';
import { TranslocoHashMap } from '../../utility/types/transloco';

export const loadUnreadNotificationCount = createAction(
  '[Account Notifications] Load Unread Count',
);

export const loadUnreadNotificationCountSuccess = createAction(
  '[Account Notifications] Load Unread Count Success',
  props<{ count: number }>(),
);

export const toastNotification = createAction(
  '[Notifications] Toast Notification',
  (
    notificationKey: NotificationKey,
    titleParams: TranslocoHashMap = {},
    messageParams: TranslocoHashMap = {},
  ) => ({
    notificationKey,
    titleParams,
    messageParams,
  }),
);
