import { toRgba } from './chart-theme';

describe('chart-theme', () => {
  describe('toRgba', () => {
    it('converts rgb() to rgba() with alpha', () => {
      expect(toRgba('rgb(239, 68, 68)', 0.4)).toBe('rgba(239, 68, 68, 0.4)');
    });

    it('returns the input when the color cannot be parsed', () => {
      expect(toRgba('not-a-color', 0.5)).toBe('not-a-color');
    });
  });
});
