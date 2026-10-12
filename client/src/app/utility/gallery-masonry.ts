/**
 * Column packing for the image gallery.
 *
 * CSS multi-column reflows the whole list when a page is appended, so photos
 * already on screen would jump. Items are placed once, into the current
 * shortest column, and stay there while later items are added.
 */

/** Extra relative height for the tag row under every card. */
export const GALLERY_MASONRY_CHROME = 0.15;

/** Used when a file has no positive width and height. Landscape 4:3. */
const FALLBACK_HEIGHT_OVER_WIDTH = 3 / 4;

export interface MasonryEntry<T> {
  item: T;
  /** Relative height. Columns share a width, so only ratios are compared. */
  weight: number;
}

/** Portrait, square, and landscape placeholders. Weights include the tag row. */
export const GALLERY_SKELETON_LAYOUTS = [
  { aspectRatio: '3 / 4', weight: 4 / 3 + GALLERY_MASONRY_CHROME },
  { aspectRatio: '1 / 1', weight: 1 + GALLERY_MASONRY_CHROME },
  {
    aspectRatio: '4 / 3',
    weight: FALLBACK_HEIGHT_OVER_WIDTH + GALLERY_MASONRY_CHROME,
  },
] as const;

/**
 * Viewport column count matching the previous Tailwind spans
 * (`md` = 768px, `xl` = 1280px).
 */
export function galleryColumnCount(viewportWidth: number): number {
  if (viewportWidth >= 1280) {
    return 3;
  }
  if (viewportWidth >= 768) {
    return 2;
  }
  return 1;
}

/** CSS `aspect-ratio` value (width / height). */
export function galleryImageAspectRatio(
  width?: number | null,
  height?: number | null,
): string {
  if (width && height && width > 0 && height > 0) {
    return `${width} / ${height}`;
  }
  return '4 / 3';
}

/** Relative card height used to choose a column. */
export function galleryImageWeight(
  width?: number | null,
  height?: number | null,
): number {
  const ratio =
    width && height && width > 0 && height > 0
      ? height / width
      : FALLBACK_HEIGHT_OVER_WIDTH;
  return ratio + GALLERY_MASONRY_CHROME;
}

/**
 * Places each entry into the shortest column.
 * Ties go to the leftmost column so an append does not move earlier items.
 */
export function packMasonryColumns<T>(
  entries: MasonryEntry<T>[],
  columnCount: number,
): T[][] {
  const count = Math.max(1, Math.floor(columnCount) || 1);
  const columns: T[][] = Array.from({ length: count }, () => []);
  const heights = Array.from({ length: count }, () => 0);

  for (const entry of entries) {
    let target = 0;
    for (let index = 1; index < count; index++) {
      if (heights[index] < heights[target]) {
        target = index;
      }
    }
    columns[target].push(entry.item);
    const weight = entry.weight > 0 ? entry.weight : 1;
    heights[target] += weight;
  }

  return columns;
}
