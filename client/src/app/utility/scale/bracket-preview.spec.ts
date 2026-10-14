import {
  buildBarBracketPreview,
  buildStackedBracketPreview,
} from './bracket-preview';

const words = { until: 'until', from: 'from' };

function gradesThrough(max: number) {
  return [
    { name: 'CLOSED_PROJECT', value: -2 },
    { name: 'OPEN_PROJECT', value: -1 },
    { name: 'UNGRADED', value: 0 },
    ...Array.from({ length: max }, (_, index) => ({
      name: `G${index + 1}`,
      value: index + 1,
    })),
  ];
}

describe('bracket preview', () => {
  const stackedBrackets = [
    { value: 5, color: '#eab308' },
    { value: 10, color: '#3b82f6' },
    { value: 15, color: '#ef4444' },
    { value: 16, color: '#22c55e' },
  ];

  it('splits grades into stacked intervals and labels them like the meter chart', () => {
    const preview = buildStackedBracketPreview(
      gradesThrough(16),
      stackedBrackets,
      words,
    );

    expect(preview).toEqual({
      gradedCount: 16,
      projectCount: 2,
      ungradedCount: 1,
      segments: [
        { color: '#eab308', count: 5, label: 'until G5' },
        { color: '#3b82f6', count: 5, label: 'G6 - G10' },
        { color: '#ef4444', count: 5, label: 'G11 - G15' },
        { color: '#22c55e', count: 1, label: 'from G16' },
      ],
    });
  });

  it('puts every grade above the last stacked boundary into the open interval', () => {
    const preview = buildStackedBracketPreview(
      gradesThrough(20),
      stackedBrackets,
      words,
    );

    expect(preview?.segments.map((segment) => segment.count)).toEqual([
      5, 5, 5, 5,
    ]);
    expect(preview?.segments[3].label).toBe('from G16');
  });

  it('falls back to the grade value and a default color when names or colors are missing', () => {
    const preview = buildStackedBracketPreview(
      [{ name: '', value: 1 }],
      [
        { value: 1, color: '  ' },
        { value: 2, color: '#112233' },
      ],
      words,
    );

    expect(preview?.segments[0].label).toBe('until 1');
    expect(preview?.segments[0].color).toBe('#eab308');
    expect(preview?.segments[0].count).toBe(1);
    expect(preview?.segments[1].count).toBe(0);
  });

  it('hides the stacked preview while intervals fail the form rules', () => {
    const grades = gradesThrough(4);
    expect(
      buildStackedBracketPreview(
        grades,
        [{ value: 1, color: '#000000' }],
        words,
      ),
    ).toBeNull();
    expect(
      buildStackedBracketPreview(
        grades,
        [
          { value: 1, color: '#000000' },
          { value: 3, color: '#111111' },
        ],
        words,
      ),
    ).toBeNull();
    expect(
      buildStackedBracketPreview(
        grades,
        [
          { value: 2, color: '#000000' },
          { value: 2, color: '#111111' },
        ],
        words,
      ),
    ).toBeNull();
    expect(
      buildStackedBracketPreview(
        grades,
        [
          { value: null, color: '#000000' },
          { value: 2, color: '#111111' },
        ],
        words,
      ),
    ).toBeNull();
  });

  it('builds the condensed bar chart and extends the last interval to the hardest grade', () => {
    const preview = buildBarBracketPreview(gradesThrough(20), [
      { name: 'Easy', value: 5 },
      { name: 'Mid', value: 10 },
      { name: 'Hard', value: 15 },
      { name: '> G16', value: 16 },
    ]);

    expect(preview).toEqual({
      gradedCount: 20,
      projectCount: 2,
      ungradedCount: 1,
      buckets: [
        { label: 'Easy', count: 5 },
        { label: 'Mid', count: 5 },
        { label: 'Hard', count: 5 },
        { label: '> G16', count: 5 },
      ],
    });
  });

  it('uses the interval value when a bar has no name', () => {
    const preview = buildBarBracketPreview(
      [
        { name: 'A', value: 1 },
        { name: 'B', value: 2 },
      ],
      [
        { name: '', value: 1 },
        { name: '  ', value: 2 },
      ],
    );

    expect(preview?.buckets).toEqual([
      { label: '1', count: 1 },
      { label: '2', count: 1 },
    ]);
  });
});
