/**
 * Parses API date strings as UTC. Naive timestamps (no Z/offset) are treated as
 * UTC, matching how the backend stores DateTime values.
 */
export function parseServerDateUtc(
  value: string | Date | null | undefined,
): Date | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const hasZone = /Z$|[+-]\d{2}:?\d{2}$/.test(raw);
  const date = new Date(hasZone ? raw : `${raw}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

/**
 * True when the viewer previously acknowledged an older rules version and the
 * current `rulesUpdatedAt` is strictly newer.
 */
export function isRulesUpdatedSinceLastView(
  acknowledgedUpdatedAt: string | Date | null | undefined,
  currentUpdatedAt: string | Date | null | undefined,
): boolean {
  const acknowledged = parseServerDateUtc(acknowledgedUpdatedAt ?? null);
  const current = parseServerDateUtc(currentUpdatedAt ?? null);
  if (!acknowledged || !current) {
    return false;
  }
  return current.getTime() > acknowledged.getTime();
}

/**
 * Rules are unread when never acknowledged, or when the current version is
 * newer than the acknowledged one.
 */
export function isRulesUnread(
  acknowledgedUpdatedAt: string | Date | null | undefined,
  currentUpdatedAt: string | Date | null | undefined,
): boolean {
  if (!acknowledgedUpdatedAt) {
    return true;
  }
  if (!currentUpdatedAt) {
    return false;
  }
  return isRulesUpdatedSinceLastView(acknowledgedUpdatedAt, currentUpdatedAt);
}
