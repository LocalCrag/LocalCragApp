import { Injectable, inject } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { NotificationItem } from '../../models/notification-item';
import { Line } from '../../models/line';
import { LineGradePipe } from '../shared/pipes/line-grade.pipe';

@Injectable()
export class NotificationPresentationService {
  private translocoService = inject(TranslocoService);
  private lineGradePipe = inject(LineGradePipe);

  public isReaction(notification: NotificationItem): boolean {
    return notification.type === 'reaction';
  }

  public notificationText(notification: NotificationItem): string {
    const lineLabel = this.formatLineLabel(notification.line);
    const topicLabel = this.formatTopicLabel(
      notification.line,
      notification.topicName,
    );

    if (notification.type === 'reaction') {
      const subject =
        notification.entityType === 'ascent'
          ? this.translocoService.translate('menu.notificationSubjectAscent', {
              label: lineLabel,
            })
          : this.translocoService.translate('menu.notificationSubjectComment', {
              label: topicLabel,
            });
      return this.translocoService
        .translate('menu.notificationTextReactionSingle', {
          actor: notification.actorName || '',
          subject,
        })
        .trim();
    }

    if (notification.type === 'comment_reply') {
      return this.translocoService
        .translate('menu.notificationTextCommentReply', {
          actor: notification.actorName || '',
          label: topicLabel,
        })
        .trim();
    }

    if (notification.type === 'fa_moderation_removed') {
      return this.translocoService
        .translate('menu.notificationTextFaRemoved', {
          actor: notification.actorName || '',
          label: lineLabel,
        })
        .trim();
    }

    return notification.actorName || notification.type;
  }

  private formatLineLabel(line: Line | null): string {
    const lineName = line?.name || '';
    const lineGrade = line ? this.lineGradePipe.transform(line) : '';
    const nameWithGrade = lineGrade
      ? `${lineName} ${lineGrade}`
      : `${lineName}`;
    return `"${nameWithGrade}"`;
  }

  private formatTopicLabel(
    line: Line | null,
    topicName: string | null,
  ): string {
    if (line) {
      return this.formatLineLabel(line);
    }
    return `"${topicName || ''}"`;
  }
}
