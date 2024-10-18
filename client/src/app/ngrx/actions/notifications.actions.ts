import {createAction} from '@ngrx/store';
import {NotificationIdentifier} from '../../utility/notifications/notification-identifier.enum';
import {HashMap} from '@jsverse/transloco';

export const toastNotification = createAction(
  '[Notifications] Toast Notification',
  (
    identifier: NotificationIdentifier,
    titleParams: HashMap = {},
    messageParams: HashMap = {},
  ) => ({
    identifier,
    titleParams,
    messageParams,
  }),
);
