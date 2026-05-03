import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { Popover } from 'primeng/popover';
import { NotificationsService } from '../../../services/crud/notifications.service';
import { NotificationItem } from '../../../models/notification-item';
import { Line } from '../../../models/line';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';

interface NotificationCluster {
  /** Stable id for @for track — grouping key, not ids[0] (order of ids can vary). */
  clusterKey: string;
  ids: string[];
  type: string;
  actorName: string | null;
  count: number;
  actionLink: string | null;
  entityType: string | null;
  line: Line | null;
  topicName: string | null;
  reactionEmoji: string | null;
}

@Component({
  selector: 'lc-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [TranslocoDirective, Popover],
  providers: [LineGradePipe],
})
export class NotificationBellComponent implements OnInit {
  notifications: NotificationItem[] = [];
  clusters: NotificationCluster[] = [];

  private notificationsService = inject(NotificationsService);
  private router = inject(Router);
  private translocoService = inject(TranslocoService);
  private lineGradePipe = inject(LineGradePipe);

  ngOnInit(): void {
    this.loadNotifications();
  }

  public loadNotifications(): void {
    this.notificationsService.getNotifications().subscribe((notifications) => {
      this.notifications = notifications;
      this.clusters = this.clusterNotifications(notifications);
    });
  }

  public markClusterRead(
    cluster: NotificationCluster,
    navigateToLink: boolean,
    popover?: Popover,
  ): void {
    this.notificationsService.markRead(cluster.ids).subscribe(() => {
      this.removeReadCluster(cluster);
      if (navigateToLink) {
        popover?.hide();
        this.router.navigateByUrl(cluster.actionLink || '/account');
      }
    });
  }

  public openCluster(cluster: NotificationCluster, popover: Popover): void {
    this.markClusterRead(cluster, true, popover);
  }

  public notificationText(cluster: NotificationCluster): string {
    const lineLabel = this.formatLineLabel(cluster.line);
    const topicLabel = this.formatTopicLabel(cluster.line, cluster.topicName);
    if (cluster.type === 'reaction') {
      const subject =
        cluster.entityType === 'ascent'
          ? this.translocoService.translate('menu.notificationSubjectAscent', {
              label: lineLabel,
            })
          : this.translocoService.translate('menu.notificationSubjectComment', {
              label: topicLabel,
            });
      if (cluster.count > 1) {
        return this.translocoService
          .translate('menu.notificationTextReactionMulti', {
            actor: cluster.actorName || '',
            count: cluster.count - 1,
            subject,
          })
          .trim();
      }
      return this.translocoService
        .translate('menu.notificationTextReactionSingle', {
          actor: cluster.actorName || '',
          subject,
        })
        .trim();
    }
    if (cluster.type === 'comment_reply') {
      return this.translocoService
        .translate('menu.notificationTextCommentReply', {
          actor: cluster.actorName || '',
          label: topicLabel,
        })
        .trim();
    }
    if (cluster.type === 'fa_moderation_removed') {
      return this.translocoService
        .translate('menu.notificationTextFaRemoved', {
          actor: cluster.actorName || '',
          label: lineLabel,
        })
        .trim();
    }
    return cluster.actorName || cluster.type;
  }

  public isReaction(cluster: NotificationCluster): boolean {
    return cluster.type === 'reaction';
  }

  private clusterNotifications(
    notifications: NotificationItem[],
  ): NotificationCluster[] {
    const groupedByKey = new Map<string, NotificationCluster>();
    const clusters: NotificationCluster[] = [];

    notifications.forEach((notification) => {
      if (notification.type === 'fa_moderation_removed') {
        clusters.push({
          clusterKey: `fa_moderation_removed|${notification.id}`,
          ids: [notification.id],
          type: notification.type,
          actorName: notification.actorName,
          count: 1,
          actionLink: notification.actionLink,
          entityType: notification.entityType,
          line: notification.line,
          topicName: notification.topicName,
          reactionEmoji: notification.reactionEmoji,
        });
        return;
      }

      const key = [
        notification.type,
        notification.type === 'reaction' ? '' : notification.actorId || '',
        notification.entityType || '',
        notification.entityId || '',
      ].join('|');
      const existing = groupedByKey.get(key);
      if (existing) {
        existing.ids.push(notification.id);
        existing.count += 1;
        return;
      }
      const cluster: NotificationCluster = {
        clusterKey: key,
        ids: [notification.id],
        type: notification.type,
        actorName: notification.actorName,
        count: 1,
        actionLink: notification.actionLink,
        entityType: notification.entityType,
        line: notification.line,
        topicName: notification.topicName,
        reactionEmoji: notification.reactionEmoji,
      };
      groupedByKey.set(key, cluster);
      clusters.push(cluster);
    });

    return clusters;
  }

  private removeReadCluster(cluster: NotificationCluster): void {
    const readIds = new Set(cluster.ids);
    this.notifications = this.notifications.filter(
      (item) => !readIds.has(item.id),
    );
    this.clusters = this.clusterNotifications(this.notifications);
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
