export type GalleryPreviewDirection = -1 | 1;

/** Minimum horizontal travel before a touch counts as a swipe. */
export const GALLERY_PREVIEW_SWIPE_THRESHOLD_PX = 48;

export type GalleryPreviewStep =
  { type: 'move'; index: number } | { type: 'load-next'; index: number };

/**
 * Next or previous index while a full-size gallery preview is open.
 *
 * Moving past the last loaded image requests the following page when one
 * exists. Once every page is loaded, navigation wraps.
 */
export function stepGalleryPreview(args: {
  index: number;
  count: number;
  hasNextPage: boolean;
  direction: GalleryPreviewDirection;
}): GalleryPreviewStep | null {
  const { index, count, hasNextPage, direction } = args;
  if (count <= 0) {
    return null;
  }
  if (direction === 1 && index >= count - 1) {
    if (hasNextPage) {
      return { type: 'load-next', index: count };
    }
    if (count === 1) {
      return null;
    }
    return { type: 'move', index: 0 };
  }
  if (direction === -1 && index <= 0) {
    if (count === 1) {
      return null;
    }
    return { type: 'move', index: count - 1 };
  }
  return { type: 'move', index: index + direction };
}

/**
 * Direction of a completed touch, or `null` when it is a tap or mostly vertical.
 * A leftward swipe moves to the next image.
 */
export function galleryPreviewSwipeDirection(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  threshold = GALLERY_PREVIEW_SWIPE_THRESHOLD_PX,
): GalleryPreviewDirection | null {
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < threshold || Math.abs(dx) <= Math.abs(dy)) {
    return null;
  }
  return dx < 0 ? 1 : -1;
}

/**
 * Preview index after an image leaves the loaded list.
 * `null` means the preview should close because nothing remains.
 */
export function galleryPreviewIndexAfterRemoval(
  index: number,
  removedIndex: number,
  nextCount: number,
): number | null {
  if (nextCount <= 0 || removedIndex < 0) {
    return nextCount <= 0 ? null : index;
  }
  let next = removedIndex < index ? index - 1 : index;
  if (next >= nextCount) {
    next = nextCount - 1;
  }
  if (next < 0) {
    next = 0;
  }
  return next;
}
