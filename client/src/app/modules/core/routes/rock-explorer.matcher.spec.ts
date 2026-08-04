import { UrlSegment } from '@angular/router';
import { rockExplorerMatcher } from './rock-explorer.matcher';

describe('rockExplorerMatcher', () => {
  it('matches /rock-explorer without feature id', () => {
    const result = rockExplorerMatcher([new UrlSegment('rock-explorer', {})]);
    expect(result).toEqual({
      consumed: [jasmine.any(UrlSegment)],
      posParams: {},
    });
    expect(result!.consumed[0].path).toBe('rock-explorer');
  });

  it('matches /rock-explorer/:featureId', () => {
    const result = rockExplorerMatcher([
      new UrlSegment('rock-explorer', {}),
      new UrlSegment('abc-123', {}),
    ]);
    expect(result).not.toBeNull();
    expect(result!.posParams['featureId'].path).toBe('abc-123');
  });

  it('rejects unrelated paths', () => {
    expect(rockExplorerMatcher([new UrlSegment('news', {})])).toBeNull();
    expect(
      rockExplorerMatcher([
        new UrlSegment('rock-explorer', {}),
        new UrlSegment('a', {}),
        new UrlSegment('b', {}),
      ]),
    ).toBeNull();
  });
});
