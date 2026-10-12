/** Viewport box used by the line-detail full-size topo preview. */
export const TOPO_PREVIEW_MAX_WIDTH_RATIO = 0.9;
export const TOPO_PREVIEW_MAX_HEIGHT_RATIO = 0.8;

export function topoPreviewMaxSize(
  viewportWidth: number,
  viewportHeight: number,
): { width: number; height: number } {
  return {
    width: viewportWidth * TOPO_PREVIEW_MAX_WIDTH_RATIO,
    height: viewportHeight * TOPO_PREVIEW_MAX_HEIGHT_RATIO,
  };
}

/**
 * Scale that fits `width`×`height` inside the box without cropping.
 * Returns 1 when a dimension is missing so callers can still draw.
 */
export function stageScaleToFit(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): number {
  if (width <= 0 || height <= 0 || maxWidth <= 0 || maxHeight <= 0) {
    return 1;
  }
  return Math.min(maxWidth / width, maxHeight / height);
}

/**
 * Source for a full-size preview. Prefer the XL thumbnail; fall back to the
 * original file when the upload is already smaller than that thumbnail.
 */
export function fullSizeTopoImageSrc(image: {
  thumbnailXL?: string | null;
  path?: string | null;
}): string {
  return image?.thumbnailXL || image?.path || '';
}
