export enum ReleaseNoteItemType {
  FEATURE = 'FEATURE',
  FIX = 'FIX',
}

export const RELEASE_NOTE_ITEM_TYPE_DISPLAY_ORDER: readonly ReleaseNoteItemType[] =
  [ReleaseNoteItemType.FEATURE, ReleaseNoteItemType.FIX];

export interface ReleaseNoteBundleItem {
  key: string;
  type: ReleaseNoteItemType;
}

export interface ReleaseNoteBundlePayload {
  id: string;
  timeCreated: string;
  items: ReleaseNoteBundleItem[];
}
