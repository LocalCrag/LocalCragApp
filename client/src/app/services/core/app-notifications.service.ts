import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import {
  getNotification,
  NotificationKey,
  NotificationType,
} from '../../utility/notifications';
import { TranslocoHashMap } from '../../utility/types/transloco';

/**
 * Shows PrimeNG toasts for app notification keys.
 * Success, info, warning, and error toasts are shown on every viewport.
 */
@Injectable({
  providedIn: 'root',
})
export class AppNotificationsService {
  private messageService = inject(MessageService);
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
    this.messageService.add({
      severity: 'success',
      detail: content,
      summary: title,
      life: 5000,
      ...(styleClass ? { styleClass } : {}),
    });
  }

  private error(title: string, content: string, styleClass?: string) {
    this.messageService.add({
      severity: 'error',
      detail: content,
      summary: title,
      life: 5000,
      ...(styleClass ? { styleClass } : {}),
    });
  }

  private info(title: string, content: string, styleClass?: string) {
    this.messageService.add({
      severity: 'info',
      detail: content,
      summary: title,
      life: 5000,
      ...(styleClass ? { styleClass } : {}),
    });
  }

  private warning(title: string, content: string, styleClass?: string) {
    this.messageService.add({
      severity: 'warn',
      detail: content,
      summary: title,
      life: 5000,
      ...(styleClass ? { styleClass } : {}),
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
