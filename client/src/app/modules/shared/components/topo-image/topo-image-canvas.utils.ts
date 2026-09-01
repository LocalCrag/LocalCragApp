import { ThumbnailWidths } from '../../../../enums/thumbnail-widths';
import { TopoImage } from '../../../../models/topo-image';
import { LinePath } from '../../../../models/line-path';
import { Label } from './point-feature-label-placement';
import Konva from 'konva';

/**
 * Projects a point onto a line segment.
 */
export function projectPointOntoSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): number[] {
  const dx = x2 - x1;
  const dy = y2 - y1;
  if (dx === 0 && dy === 0) {
    return [x1, y1];
  }
  const t = Math.max(
    0,
    Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)),
  );
  return [x1 + t * dx, y1 + t * dy];
}

/**
 * Converts relative path coordinates (0–100) to absolute canvas pixels.
 */
export function getAbsoluteCoordinates(
  points: number[],
  width: number,
  height: number,
): number[] {
  const absolutePoints = [];
  for (let i = 0; i < points.length; i++) {
    const divisor = i % 2 === 0 ? width : height;
    absolutePoints.push(Math.floor((points[i] / 100) * divisor));
  }
  return absolutePoints;
}

/**
 * Returns the closest path segment hit for the given absolute point, or null
 * if none is close enough. The returned point is projected onto the segment.
 */
export function getClosestSegmentHit(
  path: number[],
  point: number[],
  width: number,
  height: number,
  maxDistance: number,
): { insertAfterIndex: number; point: number[] } | null {
  const absolutePath = getAbsoluteCoordinates(path, width, height);
  const pointCount = absolutePath.length / 2;
  if (pointCount < 2) {
    return null;
  }

  let closestIndex = -1;
  let closestDistance = maxDistance;
  let closestPoint: number[] = null;

  for (let i = 0; i < pointCount - 1; i++) {
    const startX = absolutePath[i * 2];
    const startY = absolutePath[i * 2 + 1];
    const endX = absolutePath[i * 2 + 2];
    const endY = absolutePath[i * 2 + 3];
    const projected = projectPointOntoSegment(
      point[0],
      point[1],
      startX,
      startY,
      endX,
      endY,
    );
    const distance = Math.hypot(
      point[0] - projected[0],
      point[1] - projected[1],
    );
    if (distance <= closestDistance) {
      closestDistance = distance;
      closestIndex = i;
      closestPoint = projected;
    }
  }

  if (closestIndex < 0 || !closestPoint) {
    return null;
  }

  return {
    insertAfterIndex: closestIndex,
    point: closestPoint,
  };
}

export function getMobileSizeFactor(isMobile: boolean): number {
  return isMobile ? 1.25 : 1;
}

/**
 * Picks the best thumbnail source and skeleton dimensions for the container width.
 */
export function calculateSkeletonDimensions(
  containerWidth: number,
  topoImage: TopoImage,
): { skeletonWidth: number; skeletonHeight: number; imageSrc: string } {
  let skeletonWidth: number;
  let imageSrc = topoImage.image.path;

  if (containerWidth <= ThumbnailWidths.XS) {
    skeletonWidth = ThumbnailWidths.XS;
    imageSrc = topoImage.image.thumbnailXS;
  } else if (containerWidth <= ThumbnailWidths.S) {
    skeletonWidth = ThumbnailWidths.S;
    imageSrc = topoImage.image.thumbnailS;
  } else if (containerWidth <= ThumbnailWidths.M) {
    skeletonWidth = ThumbnailWidths.M;
    imageSrc = topoImage.image.thumbnailM;
  } else if (containerWidth <= ThumbnailWidths.XL) {
    skeletonWidth = ThumbnailWidths.L;
    imageSrc = topoImage.image.thumbnailL;
  } else {
    skeletonWidth = ThumbnailWidths.XL;
    imageSrc = topoImage.image.thumbnailXL;
  }

  if (skeletonWidth > containerWidth) {
    skeletonWidth = containerWidth;
  }

  return {
    skeletonWidth,
    skeletonHeight:
      skeletonWidth * (topoImage.image.height / topoImage.image.width),
    imageSrc,
  };
}

/**
 * Builds a label descriptor for a line path's start anchor.
 */
export function createLineLabel(
  linePath: LinePath,
  text: string,
  width: number,
  height: number,
  lineSizeMultiplicator: number,
  isMobile: boolean,
): Label {
  const absoluteCoordinates = getAbsoluteCoordinates(
    [linePath.path[0], linePath.path[1]],
    width,
    height,
  );
  const mobileSizeFactor = getMobileSizeFactor(isMobile);
  const rectSize = 11 * lineSizeMultiplicator * mobileSizeFactor;
  const rectWidth =
    rectSize * text.length - ((text.length - 1) * 2 * rectSize) / 8;
  return {
    position: {
      x: absoluteCoordinates[0],
      y: absoluteCoordinates[1],
    },
    width: rectWidth,
    height: rectSize,
    pointFeature: {
      x: absoluteCoordinates[0],
      y: absoluteCoordinates[1],
    },
    text,
  };
}

/**
 * Scales the Konva stage to fit its parent container.
 * @returns The applied scale factor.
 */
export function fitStageIntoParentContainer(
  stage: Konva.Stage,
  container: HTMLElement,
  width: number,
  height: number,
): number {
  const containerWidth = container.offsetWidth;
  const scale = containerWidth / width;
  stage.width(width * scale);
  stage.height(height * scale);
  stage.scale({ x: scale, y: scale });
  return scale;
}
