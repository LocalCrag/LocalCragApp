import {
  ReleaseNoteBundleItem,
  ReleaseNoteBundlePayload,
  ReleaseNoteItemType,
  RELEASE_NOTE_ITEM_TYPE_DISPLAY_ORDER,
} from '../models/release-note-bundle';

export type ReleaseNoteBundleSection = {
  type: ReleaseNoteItemType;
  items: ReleaseNoteBundleItem[];
};

export function releaseNoteBundleSections(
  bundle: ReleaseNoteBundlePayload | null,
): ReleaseNoteBundleSection[] {
  if (!bundle?.items?.length) {
    return [];
  }
  const byType = new Map<ReleaseNoteItemType, ReleaseNoteBundleItem[]>();
  for (const item of bundle.items) {
    if (!byType.has(item.type)) {
      byType.set(item.type, []);
    }
    byType.get(item.type)!.push(item);
  }
  const sections: ReleaseNoteBundleSection[] = [];
  for (const type of RELEASE_NOTE_ITEM_TYPE_DISPLAY_ORDER) {
    const items = byType.get(type);
    if (items?.length) {
      sections.push({ type, items });
    }
  }
  return sections;
}

/** All bundle items in display order (FEATURE groups first, then FIX). */
export function releaseNoteBundleItemsInDisplayOrder(
  bundle: ReleaseNoteBundlePayload | null,
): ReleaseNoteBundleItem[] {
  return releaseNoteBundleSections(bundle).flatMap((s) => s.items);
}
