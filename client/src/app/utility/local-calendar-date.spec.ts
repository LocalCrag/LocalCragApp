import {
  formatLocalCalendarDate,
  parseLocalCalendarDate,
} from './local-calendar-date';

describe('local-calendar-date', () => {
  describe('formatLocalCalendarDate', () => {
    it('formats the local calendar day at midnight', () => {
      const date = new Date(2026, 5, 3, 0, 0, 0, 0);
      expect(formatLocalCalendarDate(date)).toBe('2026-06-03');
    });

    it('formats the local calendar day late in the evening', () => {
      const date = new Date(2026, 5, 3, 23, 59, 59, 999);
      expect(formatLocalCalendarDate(date)).toBe('2026-06-03');
    });

    it('does not apply the legacy UTC offset shift used by Ascent.serialize', () => {
      const date = new Date(2026, 5, 3, 0, 0, 0, 0);
      const legacyShifted = new Date(
        date.getTime() + date.getTimezoneOffset() * 60000,
      );
      if (date.getTimezoneOffset() >= 0) {
        expect(formatLocalCalendarDate(date)).toBe('2026-06-03');
        return;
      }
      expect(legacyShifted.getUTCDate()).toBe(2);
      expect(formatLocalCalendarDate(date)).toBe('2026-06-03');
    });
  });

  describe('parseLocalCalendarDate', () => {
    it('round-trips with formatLocalCalendarDate', () => {
      const original = new Date(2026, 5, 3, 12, 30, 0, 0);
      const parsed = parseLocalCalendarDate(formatLocalCalendarDate(original));
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(5);
      expect(parsed.getDate()).toBe(3);
    });
  });
});
