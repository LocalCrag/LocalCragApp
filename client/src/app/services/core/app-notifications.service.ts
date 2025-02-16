import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { HashMap, TranslocoService } from '@jsverse/transloco';
import { AppState } from '../../ngrx/reducers';
import { selectIsMobile } from '../../ngrx/selectors/device.selectors';
import { MessageService } from 'primeng/api';
import {
  getNotification,
  NotificationKey,
  NotificationType,
} from '../../utility/notifications';

/**
 * Wrapper service for the angular2-notifications.
 * Modifications are:
 *   - Prevent success and info notifications on small screens
 */
@Injectable({
  providedIn: 'root',
})
export class AppNotificationsService {
  private isMobile: boolean;

  constructor(
    private messageService: MessageService,
    private translocoService: TranslocoService,
    private store: Store<AppState>,
  ) {
    this.store.pipe(select(selectIsMobile)).subscribe((isMobile) => {
      this.isMobile = isMobile;
    });
  }

  /**
   * Pushes a toast notification: either immediately or in a deferred way if currently language files are loading.
   *
   * @param notificationKey Key of the notification to push.
   * @param titleParams Translation params for the title string.
   * @param messageParams Translation params for the message string.
   */
  public toast(
    notificationKey: NotificationKey,
    titleParams: HashMap = {},
    messageParams: HashMap = {},
  ): void {
    this.doToast(notificationKey, titleParams, messageParams);
  }

  /**
   * Pushes a success notification if the screen is big enough.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private success(title: any, content: any) {
    if (!this.isMobile) {
      this.messageService.add({
        severity: 'success',
        detail: content,
        summary: title,
        life: 5000,
      });
    }
  }

  /**
   * Pushes an error notification.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private error(title: any, content: any) {
    this.messageService.add({
      severity: 'error',
      detail: content,
      summary: title,
      life: 5000,
    });
  }

  /**
   * Pushes an info notification if the screen is big enough.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private info(title: any, content: any) {
    if (!this.isMobile) {
      this.messageService.add({
        severity: 'info',
        detail: content,
        summary: title,
        life: 5000,
      });
    }
  }

  /**
   * Pushes a warning notification.
   *
   * @param title Notification title.
   * @param content Notification content.
   */
  private warning(title: any, content: any) {
    this.messageService.add({
      severity: 'warn',
      detail: content,
      summary: title,
      life: 5000,
    });
  }

  /**
   * Pushes a toast notification.
   *
   * @param notificationKey Key of the notification to push.
   * @param titleParams Translation params for the title string.
   * @param messageParams Translation params for the message string.
   */
  private doToast(
    notificationKey: NotificationKey,
    titleParams: HashMap = {},
    messageParams: HashMap = {},
  ) {
    const notificationDefinition = getNotification(notificationKey);
    const title = this.translocoService.translate(
      notificationDefinition.title,
      titleParams,
    );
    const message = this.translocoService.translate(
      notificationDefinition.message,
      messageParams,
    );
    switch (notificationDefinition.type) {
      case NotificationType.ERROR:
        this.error(title, message);
        break;
      case NotificationType.WARNING:
        this.warning(title, message);
        break;
      case NotificationType.SUCCESS:
        this.success(title, message);
        break;
      case NotificationType.INFO:
        this.info(title, message);
        break;
    }
  }
}
