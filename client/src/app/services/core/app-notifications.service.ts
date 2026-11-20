import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import {
  getNotification,
  NotificationKey,
  NotificationType,
} from '../../utility/notifications';
import { TranslocoHashMap } from '../../utility/types/transloco';

/**
 * Shows toaster notifications for app notification keys.
 * Success, info, warning, and error toasts are shown on every viewport.
 */
@Injectable({
  providedIn: 'root',
})
export class AppNotificationsService {
  private translocoService = inject(TranslocoService);

  /**
   * Pushes a toast notification.
   *
   * @param notificationKey Key of the notification to push.
   * @param titleParams Translation params for the title string.
   * @param messageParams Translation params for the message string.
   */
  public toast(
    notificationKey: NotificationKey,
    titleParams: TranslocoHashMap = {},
    messageParams: TranslocoHashMap = {},
  ): void {
    this.doToast(notificationKey, titleParams, messageParams);
  }

  private success(title: string, content: string, styleClass?: string) {
    toast.success(title, {
      description: content,
      duration: 5000,
      class: styleClass,
    });
  }

  private error(title: string, content: string, styleClass?: string) {
    toast.error(title, {
      description: content,
      duration: 5000,
      class: styleClass,
    });
  }

  private info(title: string, content: string, styleClass?: string) {
    toast.info(title, {
      description: content,
      duration: 5000,
      class: styleClass,
    });
  }

  private warning(title: string, content: string, styleClass?: string) {
    toast.warning(title, {
      description: content,
      duration: 5000,
      class: styleClass,
    });
  }

  private doToast(
    notificationKey: NotificationKey,
    titleParams: TranslocoHashMap = {},
    messageParams: TranslocoHashMap = {},
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
    const styleClass = notificationDefinition.styleClass;
    switch (notificationDefinition.type) {
      case NotificationType.ERROR:
        this.error(title, message, styleClass);
        break;
      case NotificationType.WARNING:
        this.warning(title, message, styleClass);
        break;
      case NotificationType.SUCCESS:
        this.success(title, message, styleClass);
        break;
      case NotificationType.INFO:
        this.info(title, message, styleClass);
        break;
    }
  }
}
