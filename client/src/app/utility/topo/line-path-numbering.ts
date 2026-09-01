import { LinePath } from '../../models/line-path';

/**
 * Returns line paths sorted by their display order on a topo image.
 */
export function sortLinePathsByOrderIndex(linePaths: LinePath[]): LinePath[] {
  return [...linePaths].sort((a, b) => a.orderIndex - b.orderIndex);
}
