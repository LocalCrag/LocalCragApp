/**
 * Crop geometry for the image edit dialog.
 *
 * Crop fractions are relative to the image after clockwise `rotation`
 * (0, 90, 180, or 270). The server applies that rotation first, then the
 * pixel crop.
 */

export const IMAGE_ROTATIONS = [0, 90, 180, 270] as const;

export type ImageRotation = (typeof IMAGE_ROTATIONS)[number];

export interface NormalizedCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ImageEditRequest {
  rotation: ImageRotation;
  crop: PixelCrop | null;
}

export const FULL_CROP: NormalizedCrop = { x: 0, y: 0, width: 1, height: 1 };

export type CropEdges = {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
};

export function rotatedPixelSize(
  width: number,
  height: number,
  rotation: ImageRotation,
): { width: number; height: number } {
  if (rotation === 90 || rotation === 270) {
    return { width: height, height: width };
  }
  return { width, height };
}

export function displaySize(
  width: number,
  height: number,
  rotation: ImageRotation,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const size = rotatedPixelSize(width, height, rotation);
  if (size.width < 1 || size.height < 1 || maxWidth < 1 || maxHeight < 1) {
    return { width: 1, height: 1 };
  }
  const scale = Math.min(maxWidth / size.width, maxHeight / size.height, 1);
  return {
    width: Math.max(1, Math.round(size.width * scale)),
    height: Math.max(1, Math.round(size.height * scale)),
  };
}

export function clampCrop(crop: NormalizedCrop): NormalizedCrop {
  const width = Math.min(1, Math.max(0, crop.width));
  const height = Math.min(1, Math.max(0, crop.height));
  return {
    x: Math.min(Math.max(0, crop.x), 1 - width),
    y: Math.min(Math.max(0, crop.y), 1 - height),
    width,
    height,
  };
}

/**
 * Clockwise (`1`) or counter-clockwise (`-1`) step, keeping the same pixels selected.
 * Matches Pillow `ROTATE_270` for a clockwise quarter turn.
 */
export function rotateCrop(
  crop: NormalizedCrop,
  direction: 1 | -1,
): NormalizedCrop {
  if (direction === 1) {
    return clampCrop({
      x: 1 - crop.y - crop.height,
      y: crop.x,
      width: crop.height,
      height: crop.width,
    });
  }
  return clampCrop({
    x: crop.y,
    y: 1 - crop.x - crop.width,
    width: crop.height,
    height: crop.width,
  });
}

export function nextRotation(
  rotation: ImageRotation,
  direction: 1 | -1,
): ImageRotation {
  const index = IMAGE_ROTATIONS.indexOf(rotation);
  return IMAGE_ROTATIONS[
    (index + direction + IMAGE_ROTATIONS.length) % IMAGE_ROTATIONS.length
  ];
}

export function moveCrop(
  start: NormalizedCrop,
  dx: number,
  dy: number,
): NormalizedCrop {
  return clampCrop({
    x: start.x + dx,
    y: start.y + dy,
    width: start.width,
    height: start.height,
  });
}

export function resizeCrop(
  start: NormalizedCrop,
  dx: number,
  dy: number,
  edges: CropEdges,
  minWidth: number,
  minHeight: number,
): NormalizedCrop {
  let { x, y, width, height } = start;
  const minW = Math.min(minWidth, 1);
  const minH = Math.min(minHeight, 1);

  if (edges.left) {
    const nextX = Math.min(x + width - minW, Math.max(0, x + dx));
    width = width + (x - nextX);
    x = nextX;
  }
  if (edges.right) {
    width = Math.min(1 - x, Math.max(minW, width + dx));
  }
  if (edges.top) {
    const nextY = Math.min(y + height - minH, Math.max(0, y + dy));
    height = height + (y - nextY);
    y = nextY;
  }
  if (edges.bottom) {
    height = Math.min(1 - y, Math.max(minH, height + dy));
  }

  return clampCrop({ x, y, width, height });
}

export function isFullCrop(crop: NormalizedCrop): boolean {
  return (
    crop.x <= 0.001 &&
    crop.y <= 0.001 &&
    crop.x + crop.width >= 0.999 &&
    crop.y + crop.height >= 0.999
  );
}

export function toPixelCrop(
  crop: NormalizedCrop,
  width: number,
  height: number,
  rotation: ImageRotation,
): PixelCrop {
  const size = rotatedPixelSize(width, height, rotation);
  let x = Math.round(crop.x * size.width);
  let y = Math.round(crop.y * size.height);
  let cropWidth = Math.round(crop.width * size.width);
  let cropHeight = Math.round(crop.height * size.height);
  x = Math.max(0, Math.min(x, Math.max(0, size.width - 1)));
  y = Math.max(0, Math.min(y, Math.max(0, size.height - 1)));
  cropWidth = Math.max(1, Math.min(cropWidth, size.width - x));
  cropHeight = Math.max(1, Math.min(cropHeight, size.height - y));
  return { x, y, width: cropWidth, height: cropHeight };
}

/** Matches the server rule: staff may edit any file, others only files they uploaded. */
export function canEditUploadedImage(
  user:
    | {
        id?: string | null;
        moderator?: boolean;
        admin?: boolean;
        superadmin?: boolean;
      }
    | null
    | undefined,
  createdById: string | null | undefined,
): boolean {
  if (!user) {
    return false;
  }
  if (user.moderator || user.admin || user.superadmin) {
    return true;
  }
  return createdById != null && createdById === user.id;
}
