import { format, parseISO } from 'date-fns';

/**
 * Formats a Date as YYYY-MM-DD using the local calendar day (not UTC).
 * Use when persisting date-only values from date pickers.
 */
export function formatLocalCalendarDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parses a YYYY-MM-DD string as local midnight (date-fns parseISO).
 */
export function parseLocalCalendarDate(dateString: string): Date {
  return parseISO(dateString);
}
