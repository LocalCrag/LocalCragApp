import { Line } from './line';

export interface NotificationSubjectProperties {
  line: Line | null;
  topicName: string | null;
}

export interface NotificationReactionProperties {
  emoji: string | null;
}

export interface NotificationModeratorTaskProperties {
  title: string;
  targetLabel: string;
}

export interface NotificationReleaseNotesProperties {
  releaseNoteItemKeys: string[];
}

export interface NotificationItemProperties {
  subject?: NotificationSubjectProperties;
  reaction?: NotificationReactionProperties;
  moderatorTask?: NotificationModeratorTaskProperties;
  releaseNotes?: NotificationReleaseNotesProperties;
}

export interface NotificationItem {
  id: string;
  type: string;
  timeCreated: string;
  actorId: string | null;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
  actionLink: string | null;
  isDismissed: boolean;
  properties: NotificationItemProperties;
}
