/**
 * Calendar math for ascent form quick date buttons.
 *
 * `daysBackToLastSaturday` / `daysBackToLastSunday` return how many **local calendar
 * days** to subtract from a reference instant so the result falls on that weekday
 * (see `subtractLocalCalendarDays`). Example: from a Monday, last Saturday is 2 days
 * back. On Sunday, last Saturday is 1 day back; on Saturday, last Saturday is 7 days
 * back (the previous Saturday, not today). For last Sunday: from Monday it is 1 day
 * back; on Sunday it is 7 days back (the previous Sunday, not today).
 */
/** Number of local calendar days to subtract from `from` to reach the target Saturday. */
export function daysBackToLastSaturday(from: Date): number {
  const dow = from.getDay();
  if (dow === 0) {
    return 1;
  }
  if (dow === 6) {
    return 7;
  }
  return dow + 1;
}

/** Number of local calendar days to subtract from `from` to reach the target Sunday. */
export function daysBackToLastSunday(from: Date): number {
  const dow = from.getDay();
  return dow === 0 ? 7 : dow;
}

/**
 * Returns a date `days` **local calendar days** before `from`, at local midnight.
 * Uses a noon anchor while shifting to reduce DST edge cases.
 */
export function subtractLocalCalendarDays(from: Date, days: number): Date {
  const out = new Date(from);
  out.setHours(12, 0, 0, 0);
  out.setDate(out.getDate() - days);
  out.setHours(0, 0, 0, 0);
  return out;
}
