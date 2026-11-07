import { buildGradeVoteBars, buildRatingRows } from './line-consensus';

describe('buildGradeVoteBars', () => {
  const names: Record<number, string> = { 18: '6A', 20: '6B', 22: '6C' };

  it('drops ungraded ticks and orders grades from easier to harder', () => {
    const bars = buildGradeVoteBars(
      { '22': 2, '0': 9, '18': 4, '-1': 3 },
      names,
      18,
    );

    expect(bars.map((bar) => bar.value)).toEqual([18, 22]);
    expect(bars.map((bar) => bar.name)).toEqual(['6A', '6C']);
    expect(bars[0].consensus).toBeTrue();
    expect(bars[1].consensus).toBeFalse();
    expect(bars[0].width).toBe(100);
    expect(bars[1].width).toBe(50);
  });

  it('keeps a lone small vote visible against a much larger bar', () => {
    const bars = buildGradeVoteBars({ '20': 1, '22': 40 }, names, 22);

    expect(bars[0].width).toBe(8);
    expect(bars[1].width).toBe(100);
  });

  it('returns nothing when nobody proposed a grade', () => {
    expect(buildGradeVoteBars({ '0': 4 }, names, 0)).toEqual([]);
    expect(buildGradeVoteBars(null, names, null)).toEqual([]);
  });
});

describe('buildRatingRows', () => {
  it('lists five stars down to one, with empty rows at zero width', () => {
    const rows = buildRatingRows({ '5': 4, '3': 2, '1': 0 });

    expect(rows.map((row) => row.stars)).toEqual([5, 4, 3, 2, 1]);
    expect(rows.map((row) => row.count)).toEqual([4, 0, 2, 0, 0]);
    expect(rows[0].width).toBe(100);
    expect(rows[1].width).toBe(0);
    expect(rows[2].width).toBe(50);
  });
});
