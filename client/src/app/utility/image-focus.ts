/**
 * Helpers for vertical image focus in page-title hero banners.
 *
 * Portrait images are shown with CSS `background-size: cover` in a wide 3:1
 * header. `focusY` (0–1) chooses which vertical slice stays centered; it is
 * stored on {@link File} and edited via `lc-single-image-upload`.
 */

import { File } from '../models/file';

/** Vertical center (0 = top, 1 = bottom) for page-title cover backgrounds. */
export type ImageFocusY = number;

/** Width-to-height ratio of the page title hero banner. */
export const PAGE_TITLE_ASPECT = 3;

/** Default focus: vertical center. Persisted as `null` on the server. */
export const DEFAULT_IMAGE_FOCUS_Y = 0.5;

/** Preview overlay rectangle for the visible header slice, in percent (0–100). */
export interface FocusFrameRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Clamps a focus value to the valid 0–1 range.
 */
export function clampImageFocusY(focusY: number): ImageFocusY {
  return Math.min(1, Math.max(0, focusY));
}

/**
 * Computes the 3:1 reference frame shown while adjusting focus in the uploader.
 *
 * The frame is horizontally centered; only its vertical position follows `focusY`.
 *
 * @param imageWidth Native image width in pixels.
 * @param imageHeight Native image height in pixels.
 * @param focusY Vertical center of the visible slice (0–1).
 */
export function computeFocusFrameRect(
  imageWidth: number,
  imageHeight: number,
  focusY: number,
): FocusFrameRect {
  const imageAspect = imageWidth / imageHeight;
  let width: number;
  let height: number;

  if (imageAspect >= PAGE_TITLE_ASPECT) {
    height = 1;
    width = PAGE_TITLE_ASPECT / imageAspect;
  } else {
    width = 1;
    height = imageAspect / PAGE_TITLE_ASPECT;
  }

  const clampedFocusY = clampImageFocusY(focusY);
  const maxTop = 1 - height;
  const top = Math.min(maxTop, Math.max(0, clampedFocusY - height / 2));
  const left = (1 - width) / 2;

  return {
    top: top * 100,
    left: left * 100,
    width: width * 100,
    height: height * 100,
  };
}

/**
 * Normalizes focus for API persistence: default center becomes `null`.
 */
export function normalizeImageFocusY(
  focusY: number | null | undefined,
): number | null {
  if (focusY == null || focusY === DEFAULT_IMAGE_FOCUS_Y) {
    return null;
  }
  return clampImageFocusY(focusY);
}

/**
 * Inline styles for a page-title background image with custom vertical focus.
 *
 * Only sets `background-position`; `background-size: cover` comes from SCSS.
 *
 * @param focusY Stored focus, or `null` for default centering.
 */
export function imageFocusBackgroundStyles(
  focusY: number | null | undefined,
): Record<string, string> {
  if (focusY == null) {
    return {};
  }

  return {
    'background-position': `center ${clampImageFocusY(focusY) * 100}%`,
  };
}

/** Static fallback hero when no entity or instance background image is set. */
export const PAGE_TITLE_DEFAULT_BG_IMAGE = '/assets/bg.jpeg';

/**
 * Inline styles for the static default page-title hero background.
 */
export function pageTitleDefaultBgStyles(): Record<string, string> {
  return {
    'background-image': `url(${PAGE_TITLE_DEFAULT_BG_IMAGE})`,
  };
}

/**
 * CSS custom properties for a responsive page-title hero background.
 *
 * Thumbnail size is chosen in {@link PageTitleComponent} SCSS via media queries
 * aligned with {@link ThumbnailWidths}.
 */
export function pageTitleImageCssVars(
  file: File | null | undefined,
): Record<string, string> {
  if (!file) {
    return {};
  }

  return {
    '--page-title-img-m': `url(${file.thumbnailM})`,
    '--page-title-img-l': `url(${file.thumbnailL})`,
    '--page-title-img-xl': `url(${file.thumbnailXL})`,
  };
}
