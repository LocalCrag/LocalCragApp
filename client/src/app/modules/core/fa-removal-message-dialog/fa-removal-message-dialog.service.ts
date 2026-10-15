import { Injectable, inject } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { NotificationItem } from '../../../models/notification-item';
import { NotificationsService } from '../../../services/crud/notifications.service';
import {
  FaRemovalMessageDialogComponent,
  FaRemovalMessageDialogData,
} from './fa-removal-message-dialog.component';

@Injectable()
export class FaRemovalMessageDialogService {
  private dialogService = inject(DialogService);
  private notificationsService = inject(NotificationsService);
  private translocoService = inject(TranslocoService);

  private openRef: DynamicDialogRef | undefined;

  public openFromNotification(notification: NotificationItem): boolean {
    const message = notification.properties.faRemoval?.message;
    if (notification.type !== 'fa_moderation_removed' || !message) {
      return false;
    }
    this.open({
      message,
      ascentLink: notification.actionLink,
    });
    return true;
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

  public open(data: FaRemovalMessageDialogData): void {
    this.openRef?.close();
    const headerKey = data.unavailable
      ? marker('faRemoval.dialog.unavailableTitle')
      : marker('faRemoval.dialog.title');
    this.openRef = this.dialogService.open(FaRemovalMessageDialogComponent, {
      header: this.translocoService.translate(headerKey),
      data,
      modal: true,
      dismissableMask: true,
      closeOnEscape: true,
      styleClass: 'fa-removal-message-dialog-host',
      width: '36rem',
      breakpoints: { '640px': '95vw' },
    });
  }
}
