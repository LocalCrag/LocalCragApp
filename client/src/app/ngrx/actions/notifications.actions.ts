import { createAction } from '@ngrx/store';
import { HashMap } from '@jsverse/transloco';
import { NotificationKey } from '../../utility/notifications';

export const toastNotification = createAction(
  '[Notifications] Toast Notification',
  (
    notificationKey: NotificationKey,
    titleParams: HashMap = {},
    messageParams: HashMap = {},
  ) => ({
    notificationKey,
    titleParams,
    messageParams,
  }),
);
