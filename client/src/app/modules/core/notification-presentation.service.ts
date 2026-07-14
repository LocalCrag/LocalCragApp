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
    const subject = notification.properties.subject;
    const lineLabel = this.formatLineLabel(subject?.line ?? null);
    const topicLabel = this.formatTopicLabel(
      subject?.line ?? null,
      subject?.topicName ?? null,
    );
    const moderatorTask = notification.properties.moderatorTask;

    if (notification.type === 'reaction') {
      const subjectLabel =
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
          subject: subjectLabel,
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

    if (notification.type === 'moderator_task_completed') {
      return this.translocoService
        .translate('menu.notificationTextModeratorTaskCompleted', {
          actor: notification.actorName || '',
          title: moderatorTask?.title || '',
          label: moderatorTask?.targetLabel || '',
        })
        .trim();
    }

    if (notification.type === 'moderator_task_created') {
      return this.translocoService
        .translate('menu.notificationTextModeratorTaskCreated', {
          actor: notification.actorName || '',
          title: moderatorTask?.title || '',
          label: moderatorTask?.targetLabel || '',
        })
        .trim();
    }

    if (notification.type === 'moderator_task_created_and_assigned') {
      return this.translocoService
        .translate('menu.notificationTextModeratorTaskCreatedAndAssigned', {
          actor: notification.actorName || '',
          title: moderatorTask?.title || '',
          label: moderatorTask?.targetLabel || '',
        })
        .trim();
    }

    if (notification.type === 'moderator_task_assigned') {
      return this.translocoService
        .translate('menu.notificationTextModeratorTaskAssigned', {
          actor: notification.actorName || '',
          title: moderatorTask?.title || '',
          label: moderatorTask?.targetLabel || '',
        })
        .trim();
    }

    if (notification.type === 'release_notes') {
      const lead = this.translocoService
        .translate('menu.notificationTextReleaseNotesLead')
        .trim();
      const keys =
        notification.properties.releaseNotes?.releaseNoteItemKeys ?? [];
      if (keys.length === 0) {
        return lead;
      }
      const titles = keys
        .map((k) =>
          this.translocoService
            .translate(`releaseNotes.notes.${k}_title`)
            .trim(),
        )
        .filter(Boolean);
      if (titles.length === 0) {
        return lead;
      }
      return `${lead}: ${titles.join(', ')}`;
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
