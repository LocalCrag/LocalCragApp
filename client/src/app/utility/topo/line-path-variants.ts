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
 * Labels for a topo image and its line list.
 * Normal lines are 1, 2, 3… in topo order. Variants are V1, V2… in their own order,
 * so a variant between two lines does not leave a gap in the main sequence.
 */
export function topoLinePathDisplayNumbers(
  linePaths: LinePath[] | null | undefined,
): Map<LinePath, string> {
  const labels = new Map<LinePath, string>();
  let lineNumber = 0;
  let variantNumber = 0;
  for (const linePath of sortLinePathsByOrderIndex(linePaths ?? [])) {
    if (isVariantLinePath(linePath)) {
      variantNumber += 1;
      labels.set(linePath, `V${variantNumber}`);
    } else {
      lineNumber += 1;
      labels.set(linePath, String(lineNumber));
    }
  }
  return labels;
}

/**
 * The show/hide control only applies when an image has both normal lines and variants.
 * An image that is only variants shows those lines outright.
 */
export function topoImageCanHideVariants(
  linePaths: LinePath[] | null | undefined,
): boolean {
  const paths = linePaths ?? [];
  let variantCount = 0;
  for (const linePath of paths) {
    if (isVariantLinePath(linePath)) {
      variantCount += 1;
    }
  }
  return variantCount > 0 && variantCount < paths.length;
}

/**
 * Paths drawn on a topo image.
 * Variant paths stay hidden until the viewer asks for them, unless every path is a variant.
 * Order matches the stored order index so visible numbers do not shift.
 */
export function linePathsForTopoCanvas(
  linePaths: LinePath[] | null | undefined,
  includeVariants: boolean,
): LinePath[] {
  const ordered = sortLinePathsByOrderIndex(linePaths ?? []);
  if (includeVariants || !topoImageCanHideVariants(ordered)) {
    return ordered;
  }
  return ordered.filter((linePath) => !isVariantLinePath(linePath));
}
