export interface LinePathEditorCanvasBox {
  /** Width of the editor row, including the side panel. */
  rowWidth: number;
  /** Side panel width plus the gap before it. */
  sidePanelSpace: number;
  viewportHeight: number;
  /** Distance from the top of the document to the canvas. */
  canvasTop: number;
  /** Toolbar, save actions, and padding that must stay below the canvas. */
  spaceBelow: number;
  imageWidth: number;
  imageHeight: number;
}

/**
 * Largest canvas width that still fits the editor column and the free height
 * inside it. The photo keeps its aspect ratio, so it fills whichever side of
 * that box runs out first.
 * Returns null when the image or the row has not been measured yet.
 */
export function linePathEditorCanvasWidth(
  box: LinePathEditorCanvasBox,
): number | null {
  if (box.imageWidth <= 0 || box.imageHeight <= 0 || box.rowWidth <= 0) {
    return null;
  }

  const availableWidth = box.rowWidth - box.sidePanelSpace;
  if (availableWidth <= 0) {
    return null;
  }

  const availableHeight = box.viewportHeight - box.canvasTop - box.spaceBelow;
  if (availableHeight <= 0) {
    return availableWidth;
  }

  const widthToFitHeight = availableHeight * (box.imageWidth / box.imageHeight);
  return Math.min(availableWidth, widthToFitHeight);
}
