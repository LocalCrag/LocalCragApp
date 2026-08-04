import { UrlMatchResult, UrlSegment } from '@angular/router';

/**
 * Matches `/rock-explorer` and `/rock-explorer/:featureId` as one route config
 * so Angular reuses `RockExplorerComponent` when the feature id segment changes.
 */
export function rockExplorerMatcher(
  segments: UrlSegment[],
): UrlMatchResult | null {
  if (segments.length === 0 || segments[0].path !== 'rock-explorer') {
    return null;
  }
  if (segments.length === 1) {
    return { consumed: segments, posParams: {} };
  }
  if (segments.length === 2) {
    return {
      consumed: segments,
      posParams: { featureId: segments[1] },
    };
  }
  return null;
}
