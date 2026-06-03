import { Ascent } from './ascent';
import { Line } from './line';

describe('Ascent', () => {
  describe('serialize', () => {
    it('serializes date as local calendar day', () => {
      const ascent = new Ascent();
      ascent.date = new Date(2026, 5, 3, 0, 0, 0, 0);
      ascent.line = { id: '42' } as unknown as Line;

      const payload = Ascent.serialize(ascent);

      expect(payload.date).toBe('2026-06-03');
    });
  });
});
