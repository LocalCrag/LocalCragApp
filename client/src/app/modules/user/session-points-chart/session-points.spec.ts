import {
  defaultSessionScale,
  filledSessionRanges,
  gradeCounts,
  sessionBars,
} from './session-points';

const today = new Date(2026, 10, 7);

describe('sessionBars', () => {
  const groups = [
    {
      date: '2026-11-01',
      lineType: 'BOULDER',
      gradeScale: 'FB',
      grades: [8, 12, 4, 11, 9, 7, 6, 5, 3, 2, 1],
    },
    {
      date: '2024-01-01',
      lineType: 'BOULDER',
      gradeScale: 'FB',
      grades: [20, 0, -1],
    },
    {
      date: '2026-11-01',
      lineType: 'SPORT',
      gradeScale: 'UIAA',
      grades: [15],
    },
  ];

  it('sums every scored line of the day and drops grades that are not points', () => {
    const bars = sessionBars(
      groups,
      { lineType: 'BOULDER', gradeScale: 'FB' },
      'all',
      today,
    );
    expect(bars.map((bar) => bar.date)).toEqual(['2024-01-01', '2026-11-01']);
    expect(bars[0]).toEqual({
      date: '2024-01-01',
      points: 20,
      count: 1,
      grades: [20],
    });
    expect(bars[1].points).toBe(68);
    expect(bars[1].count).toBe(11);
  });

  it('keeps the last three months', () => {
    const [bar] = sessionBars(
      groups,
      { lineType: 'BOULDER', gradeScale: 'FB' },
      '3m',
      today,
    );
    expect(bar.date).toBe('2026-11-01');
    expect(bar.points).toBe(68);
    expect(bar.count).toBe(11);
  });

  it('keeps only the selected scale', () => {
    const bars = sessionBars(
      groups,
      { lineType: 'SPORT', gradeScale: 'UIAA' },
      'all',
      today,
    );
    expect(bars).toEqual([
      { date: '2026-11-01', points: 15, count: 1, grades: [15] },
    ]);
  });
});

describe('filledSessionRanges', () => {
  it('hides presets that would show the same days as the full history', () => {
    expect(filledSessionRanges(['2026-10-01'], today)).toEqual([]);
  });

  it('offers the windows that cut off older sessions', () => {
    expect(filledSessionRanges(['2024-01-01', '2026-11-01'], today)).toEqual([
      '3m',
      '1y',
      'all',
    ]);
  });
});

describe('defaultSessionScale', () => {
  it('picks the scale with the most lines', () => {
    expect(
      defaultSessionScale([
        {
          date: '2026-11-01',
          lineType: 'SPORT',
          gradeScale: 'UIAA',
          grades: [15],
        },
        {
          date: '2026-11-01',
          lineType: 'BOULDER',
          gradeScale: 'FB',
          grades: [12, 10],
        },
      ]),
    ).toEqual({ lineType: 'BOULDER', gradeScale: 'FB' });
  });
});

describe('gradeCounts', () => {
  it('groups equal grades and lists the hardest first', () => {
    expect(gradeCounts([10, 12, 10])).toEqual([
      { gradeValue: 12, count: 1 },
      { gradeValue: 10, count: 2 },
    ]);
  });
});
