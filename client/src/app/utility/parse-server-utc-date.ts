/**
 * Parses a server DateTime that is stored/serialized as naive UTC
 * (Marshmallow `DateTime` without an offset). Strings that already include a
 * timezone designator (`Z` or `±HH:MM`) are parsed as-is.
 *
 * Use this for all API **instant** timestamps (`timeCreated`, `timeUpdated`,
 * `activatedAt`, `rulesUpdatedAt`, …). Do **not** use it for calendar-only
 * `YYYY-MM-DD` fields — those go through `parseLocalCalendarDate`.
 *
 * Without this, `new Date("2026-07-24T12:00:00")` is treated as **local** time,
 * which breaks round-trips that acknowledge via `toISOString()` and later
 * re-load the naive dump from the API (see #1230).
 */
export function parseServerUtcDate(
  value: string | Date | null | undefined,
): Date | null {
  if (value == null || value === '') {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(raw);
  const date = new Date(hasTimezone ? raw : `${raw}Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}
