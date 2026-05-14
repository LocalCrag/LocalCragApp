import { Line } from './line';

export interface NotificationItem {
  id: string;
  type: string;
  timeCreated: string;
  actorId: string | null;
  actorName: string | null;
  entityType: string | null;
  entityId: string | null;
  actionLink: string | null;
  line: Line | null;
  topicName: string | null;
  reactionEmoji: string | null;
  isDismissed: boolean;
  releaseNoteItemKeys?: string[];
}
