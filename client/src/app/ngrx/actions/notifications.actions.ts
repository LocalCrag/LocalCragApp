import { createAction } from '@ngrx/store';
import { NotificationKey } from '../../utility/notifications';
import { TranslocoHashMap } from '../../utility/types/transloco';

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
