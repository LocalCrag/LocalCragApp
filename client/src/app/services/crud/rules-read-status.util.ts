/**
 * True when the viewer previously acknowledged an older rules version and the
 * current `rulesUpdatedAt` is strictly newer.
 */
export function isRulesUpdatedSinceLastView(
  acknowledgedUpdatedAt: Date | null | undefined,
  currentUpdatedAt: Date | null | undefined,
): boolean {
  if (!acknowledgedUpdatedAt || !currentUpdatedAt) {
    return false;
  }
  return currentUpdatedAt.getTime() > acknowledgedUpdatedAt.getTime();
}

/**
 * Rules are unread when never acknowledged, or when the current version is
 * newer than the acknowledged one.
 */
export function isRulesUnread(
  acknowledgedUpdatedAt: Date | null | undefined,
  currentUpdatedAt: Date | null | undefined,
): boolean {
  if (!acknowledgedUpdatedAt) {
    return true;
  }
  if (!currentUpdatedAt) {
    return false;
  }
  return isRulesUpdatedSinceLastView(acknowledgedUpdatedAt, currentUpdatedAt);
}
