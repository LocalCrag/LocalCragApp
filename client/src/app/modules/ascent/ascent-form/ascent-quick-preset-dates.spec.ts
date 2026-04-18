import {
  daysBackToLastSaturday,
  daysBackToLastSunday,
  subtractLocalCalendarDays,
} from './ascent-quick-preset-dates';

describe('ascent-quick-preset-dates', () => {
  describe('daysBackToLastSaturday', () => {
    it('on Sunday counts back 1 day to the previous Saturday', () => {
      const sunday = new Date(2026, 3, 19, 10, 0, 0, 0);
      expect(daysBackToLastSaturday(sunday)).toBe(1);
      const sat = subtractLocalCalendarDays(sunday, 1);
      expect(sat.getDay()).toBe(6);
      expect(sat.getDate()).toBe(18);
    });

    it('on Saturday counts back 7 days', () => {
      const saturday = new Date(2026, 3, 18, 10, 0, 0, 0);
      expect(daysBackToLastSaturday(saturday)).toBe(7);
    });

    it('on Monday counts back 2 days', () => {
      const monday = new Date(2026, 3, 20, 10, 0, 0, 0);
      expect(daysBackToLastSaturday(monday)).toBe(2);
    });
  });

  describe('daysBackToLastSunday', () => {
    it('on Sunday counts back 7 days', () => {
      const sunday = new Date(2026, 3, 19, 10, 0, 0, 0);
      expect(daysBackToLastSunday(sunday)).toBe(7);
    });

    it('on Monday counts back 1 day', () => {
      const monday = new Date(2026, 3, 20, 10, 0, 0, 0);
      expect(daysBackToLastSunday(monday)).toBe(1);
    });
  });

  describe('subtractLocalCalendarDays', () => {
    it('does not mix day-of-month across months', () => {
      const april1 = new Date(2026, 3, 1, 8, 0, 0, 0);
      const back1 = subtractLocalCalendarDays(april1, 1);
      expect(back1.getMonth()).toBe(2);
      expect(back1.getDate()).toBe(31);
    });
  });
});
