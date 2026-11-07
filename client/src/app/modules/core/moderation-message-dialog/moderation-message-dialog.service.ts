import { Injectable, inject } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { NotificationItem } from '../../../models/notification-item';
import { NotificationsService } from '../../../services/crud/notifications.service';
import {
  ModerationMessageDialogComponent,
  ModerationMessageDialogData,
} from './moderation-message-dialog.component';

@Injectable()
export class ModerationMessageDialogService {
  private dialogService = inject(DialogService);
  private notificationsService = inject(NotificationsService);
  private translocoService = inject(TranslocoService);

  private openRef: DynamicDialogRef | undefined;

  public openFromNotification(notification: NotificationItem): boolean {
    if (notification.type === 'fa_moderation_removed') {
      const message = notification.properties.faRemoval?.message;
      if (!message) {
        return false;
      }
      this.open(
        { message, ascentLink: notification.actionLink },
        marker('faRemoval.dialog.title'),
      );
      return true;
    }
    if (notification.type === 'ascent_video_removed') {
      const message = notification.properties.ascentVideoRemoval?.message;
      if (!message) {
        return false;
      }
      this.open(
        { message, ascentLink: notification.actionLink },
        marker('ascentVideoRemoval.dialog.title'),
      );
      return true;
    }
    return false;
  }

  public openById(notificationId: string): void {
    this.notificationsService.getNotification(notificationId).subscribe({
      next: (notification) => {
        this.openFromNotification(notification);
      },
      error: () => {
        this.open({
          message: this.translocoService.translate(
            marker('faRemoval.dialog.unavailableText'),
          ),
          ascentLink: null,
          unavailable: true,
        });
      },
    });
  }

  public open(
    data: ModerationMessageDialogData,
    titleKey: string = marker('faRemoval.dialog.title'),
  ): void {
    this.openRef?.close();
    const headerKey = data.unavailable
      ? marker('faRemoval.dialog.unavailableTitle')
      : titleKey;
    this.openRef = this.dialogService.open(ModerationMessageDialogComponent, {
      header: this.translocoService.translate(headerKey),
      data,
      modal: true,
      dismissableMask: true,
      closeOnEscape: true,
      styleClass: 'moderation-message-dialog-host',
      width: '36rem',
      breakpoints: { '640px': '95vw' },
    });
  }
}
