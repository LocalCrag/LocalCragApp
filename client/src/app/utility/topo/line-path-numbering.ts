import { LinePath } from '../../models/line-path';

/**
 * Returns line paths sorted by their display order on a topo image.
 */
export function sortLinePathsByOrderIndex(linePaths: LinePath[]): LinePath[] {
  return [...linePaths]
    .map((linePath, index) => ({ linePath, index }))
    .sort((a, b) => {
      const orderA = a.linePath.orderIndex ?? a.index;
      const orderB = b.linePath.orderIndex ?? b.index;
      return orderA - orderB;
    })
    .map(({ linePath }) => linePath);
}

/**
 * Returns the 1-based display number for a line path on a topo image.
 * Falls back to array position when orderIndex is not set (e.g. legacy payloads).
 */
export function getLinePathDisplayNumber(
  linePath: LinePath,
  fallbackIndex?: number,
): string {
  if (Number.isFinite(linePath.orderIndex)) {
    return String(linePath.orderIndex + 1);
  }
  if (fallbackIndex != null) {
    return String(fallbackIndex + 1);
  }
  return '1';
}
