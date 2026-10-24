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

export interface NotificationAdminMessageProperties {
  title: string;
  text: string;
}

export interface NotificationFaRemovalProperties {
  message: string;
}

export interface NotificationSuggestionReviewSubject {
  kind: 'line' | 'topoImage';
  name?: string;
  title?: string | null;
  color?: string | null;
  cragName?: string;
  sectorName?: string;
  areaName?: string;
  linePaths?: unknown[];
  image?: unknown;
}

export interface NotificationSuggestionReviewProperties {
  message: string | null;
  targetLink?: string | null;
  subject?: NotificationSuggestionReviewSubject | null;
}

export interface NotificationItemProperties {
  subject?: NotificationSubjectProperties;
  reaction?: NotificationReactionProperties;
  moderatorTask?: NotificationModeratorTaskProperties;
  releaseNotes?: NotificationReleaseNotesProperties;
  adminMessage?: NotificationAdminMessageProperties;
  faRemoval?: NotificationFaRemovalProperties;
  suggestionReview?: NotificationSuggestionReviewProperties;
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
