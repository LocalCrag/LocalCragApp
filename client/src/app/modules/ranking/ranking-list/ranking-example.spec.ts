import { rankingExampleFromGrades } from './ranking-example';

describe('rankingExampleFromGrades', () => {
  it('uses the grade worth 10 points and the next grade', () => {
    expect(
      rankingExampleFromGrades([
        { name: 'UNGRADED', value: 0 },
        { name: '6A', value: 10 },
        { name: '6A+', value: 11 },
        { name: '6B', value: 12 },
      ]),
    ).toEqual({
      grade: '6A',
      points: 10,
      nextGrade: '6A+',
      nextPoints: 11,
    });
  });

  it('uses a middle pair when the scale has no grade worth 10 points', () => {
    expect(
      rankingExampleFromGrades([
        { name: 'V0', value: 1 },
        { name: 'V1', value: 2 },
        { name: 'V2', value: 3 },
        { name: 'V3', value: 4 },
      ]),
    ).toEqual({
      grade: 'V1',
      points: 2,
      nextGrade: 'V2',
      nextPoints: 3,
    });
  });

  it('returns null when the scale has fewer than two scored grades', () => {
    expect(rankingExampleFromGrades([{ name: '6A', value: 10 }])).toBeNull();
  });
});
