import {
  linePathEditorCanvasWidth,
  LinePathEditorCanvasBox,
} from './line-path-editor-canvas-size';

function box(
  overrides: Partial<LinePathEditorCanvasBox> = {},
): LinePathEditorCanvasBox {
  return {
    rowWidth: 1600,
    sidePanelSpace: 312,
    viewportHeight: 1200,
    canvasTop: 280,
    spaceBelow: 140,
    imageWidth: 4000,
    imageHeight: 2000,
    ...overrides,
  };
}

describe('linePathEditorCanvasWidth', () => {
  it('uses the full column when the photo is wider than the free height', () => {
    // Free width is 1288. Free height is 780, which would allow 1560.
    expect(linePathEditorCanvasWidth(box())).toBe(1288);
  });

  it('uses the free height when that limits a wide photo', () => {
    const width = linePathEditorCanvasWidth(box({ viewportHeight: 900 }));

    // 900 - 280 - 140 = 480px of image height, aspect 2 => 960px wide.
    expect(width).toBe(960);
  });

  it('uses the free height for a tall photo instead of the full column', () => {
    const width = linePathEditorCanvasWidth(
      box({ imageWidth: 2000, imageHeight: 4000 }),
    );

    // Free height 780 and aspect 0.5 => 390px wide.
    expect(width).toBe(390);
  });

  it('stays inside a narrow column', () => {
    expect(
      linePathEditorCanvasWidth(
        box({ rowWidth: 700, sidePanelSpace: 312, imageHeight: 4000 }),
      ),
    ).toBe(388);
  });

  it('uses the full column when the height cannot be measured', () => {
    expect(linePathEditorCanvasWidth(box({ viewportHeight: 0 }))).toBe(1288);
  });

  it('returns null until the image and the row have a size', () => {
    expect(linePathEditorCanvasWidth(box({ imageWidth: 0 }))).toBeNull();
    expect(linePathEditorCanvasWidth(box({ rowWidth: 0 }))).toBeNull();
    expect(linePathEditorCanvasWidth(box({ sidePanelSpace: 1600 }))).toBeNull();
  });
});
