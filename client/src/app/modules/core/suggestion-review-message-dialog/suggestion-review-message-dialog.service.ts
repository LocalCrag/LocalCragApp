import { Injectable, inject } from '@angular/core';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import {
  NotificationItem,
  NotificationSuggestionReviewSubject,
} from '../../../models/notification-item';
import { NotificationsService } from '../../../services/crud/notifications.service';
import { SuggestionReviewMessageDialogComponent } from './suggestion-review-message-dialog.component';

@Injectable()
export class SuggestionReviewMessageDialogService {
  private dialogService = inject(DialogService);
  private notificationsService = inject(NotificationsService);
  private translocoService = inject(TranslocoService);

  private openRef: DynamicDialogRef | undefined;

  public openFromNotification(notification: NotificationItem): boolean {
    if (
      notification.type !== 'suggestion_published' &&
      notification.type !== 'suggestion_rejected'
    ) {
      return false;
    }
    const review = notification.properties.suggestionReview;
    const headerKey =
      notification.type === 'suggestion_published'
        ? marker('suggestionReview.dialog.publishedTitle')
        : marker('suggestionReview.dialog.rejectedTitle');
    this.open(
      review?.message ?? '',
      this.translocoService.translate(headerKey),
      review?.targetLink ?? null,
      review?.subject ?? null,
    );
    return true;
  }

  public openById(notificationId: string): void {
    this.notificationsService.getNotification(notificationId).subscribe({
      next: (notification) => {
        this.openFromNotification(notification);
      },
      error: () => {
        this.open(
          this.translocoService.translate(
            marker('suggestionReview.dialog.unavailableText'),
          ),
          this.translocoService.translate(
            marker('suggestionReview.dialog.unavailableTitle'),
          ),
          null,
          null,
        );
      },
    });
  }

  private open(
    message: string,
    header: string,
    targetLink: string | null,
    subject: NotificationSuggestionReviewSubject | null,
  ): void {
    this.openRef?.close();
    this.openRef = this.dialogService.open(
      SuggestionReviewMessageDialogComponent,
      {
        header,
        data: { message, targetLink, subject },
        modal: true,
        dismissableMask: true,
        closeOnEscape: true,
        styleClass: 'suggestion-review-message-dialog-host',
        width: '42rem',
        breakpoints: { '640px': '95vw' },
      },
    );
  }
}
