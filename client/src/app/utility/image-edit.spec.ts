import {
  canEditUploadedImage,
  FULL_CROP,
  isFullCrop,
  moveCrop,
  nextRotation,
  resizeCrop,
  rotateCrop,
  toPixelCrop,
} from './image-edit';

describe('image edit geometry', () => {
  it('returns a crop to its start after four clockwise turns', () => {
    let crop = { x: 0.1, y: 0.2, width: 0.3, height: 0.4 };
    for (let step = 0; step < 4; step += 1) {
      crop = rotateCrop(crop, 1);
    }
    expect(crop.x).toBeCloseTo(0.1);
    expect(crop.y).toBeCloseTo(0.2);
    expect(crop.width).toBeCloseTo(0.3);
    expect(crop.height).toBeCloseTo(0.4);
  });

  it('keeps a full-frame crop full when rotated', () => {
    expect(isFullCrop(rotateCrop(FULL_CROP, 1))).toBeTrue();
    expect(isFullCrop(rotateCrop(FULL_CROP, -1))).toBeTrue();
  });

  it('steps rotation through the four right angles', () => {
    expect(nextRotation(0, 1)).toBe(90);
    expect(nextRotation(270, 1)).toBe(0);
    expect(nextRotation(0, -1)).toBe(270);
  });

  it('keeps the left half on the top after a clockwise turn', () => {
    expect(rotateCrop({ x: 0, y: 0, width: 0.5, height: 1 }, 1)).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 0.5,
    });
  });

  it('converts a normalized crop into rotated pixels', () => {
    expect(
      toPixelCrop({ x: 0, y: 0.5, width: 1, height: 0.5 }, 100, 50, 90),
    ).toEqual({ x: 0, y: 50, width: 50, height: 50 });
  });

  it('keeps a moved crop inside the frame', () => {
    expect(
      moveCrop({ x: 0.8, y: 0.8, width: 0.3, height: 0.3 }, 0.5, 0.5),
    ).toEqual({ x: 0.7, y: 0.7, width: 0.3, height: 0.3 });
  });

  it('shrinks from the left edge without crossing the minimum', () => {
    const next = resizeCrop(
      { x: 0, y: 0, width: 1, height: 1 },
      0.4,
      0,
      { left: true },
      0.2,
      0.2,
    );
    expect(next.x).toBeCloseTo(0.4);
    expect(next.width).toBeCloseTo(0.6);
  });
});

describe('canEditUploadedImage', () => {
  const owner = { id: 'user-1' };

  it('allows the uploader and staff', () => {
    expect(canEditUploadedImage(owner, 'user-1')).toBeTrue();
    expect(
      canEditUploadedImage({ id: 'mod', moderator: true }, 'user-1'),
    ).toBeTrue();
    expect(canEditUploadedImage({ id: 'admin', admin: true }, null)).toBeTrue();
  });

  it('hides the edit for someone else and for a missing uploader', () => {
    expect(canEditUploadedImage(owner, 'user-2')).toBeFalse();
    expect(canEditUploadedImage(owner, null)).toBeFalse();
    expect(canEditUploadedImage(null, 'user-1')).toBeFalse();
  });
});
