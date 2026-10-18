import { LinePath } from '../../models/line-path';
import { sortLinePathsByOrderIndex } from './line-path-numbering';

/**
 * A line path is a variant when its line is marked as one.
 * Missing line data is treated as a normal line.
 */
export function isVariantLinePath(linePath: LinePath): boolean {
  return linePath.line?.variant === true;
}

/** Non-variant paths in topo display order. */
export function primaryTopoLinePaths(
  linePaths: LinePath[] | null | undefined,
): LinePath[] {
  return sortLinePathsByOrderIndex(linePaths ?? []).filter(
    (linePath) => !isVariantLinePath(linePath),
  );
}

/** Variant paths in topo display order. */
export function variantTopoLinePaths(
  linePaths: LinePath[] | null | undefined,
): LinePath[] {
  return sortLinePathsByOrderIndex(linePaths ?? []).filter((linePath) =>
    isVariantLinePath(linePath),
  );
}

/**
 * Paths drawn on a topo image.
 * Variant paths stay hidden until the viewer asks for them.
 * Order matches the stored order index so visible numbers do not shift.
 */
export function linePathsForTopoCanvas(
  linePaths: LinePath[] | null | undefined,
  includeVariants: boolean,
): LinePath[] {
  const ordered = sortLinePathsByOrderIndex(linePaths ?? []);
  if (includeVariants) {
    return ordered;
  }
  return ordered.filter((linePath) => !isVariantLinePath(linePath));
}
