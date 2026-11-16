import { Injectable, inject } from '@angular/core';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
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
  private dialogService = inject(HlmDialogService);
  private notificationsService = inject(NotificationsService);
  private translocoService = inject(TranslocoService);

  private openRef: BrnDialogRef | undefined;

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
        context: { message, targetLink, subject, title: header },
        contentClass: 'suggestion-review-message-dialog-host sm:max-w-2xl',
      },
    );
  }
}
