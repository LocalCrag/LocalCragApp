import {
  fullSizeTopoImageSrc,
  stageScaleToFit,
  topoPreviewMaxSize,
} from './topo-image-preview';

describe('topo image preview', () => {
  it('fits a wide image to the viewport width', () => {
    expect(stageScaleToFit(4000, 2000, 900, 800)).toBeCloseTo(0.225);
  });

  it('fits a tall image to the viewport height', () => {
    expect(stageScaleToFit(1000, 4000, 900, 800)).toBeCloseTo(0.2);
  });

  it('returns 1 when a dimension is missing', () => {
    expect(stageScaleToFit(0, 1000, 900, 800)).toBe(1);
    expect(stageScaleToFit(1000, 1000, 0, 800)).toBe(1);
  });

  it('sizes the preview box to 90vw by 80vh', () => {
    expect(topoPreviewMaxSize(1000, 500)).toEqual({ width: 900, height: 400 });
  });

  it('prefers the XL thumbnail for the full-size source', () => {
    expect(
      fullSizeTopoImageSrc({
        thumbnailXL: 'photo_xl.jpg',
        path: 'photo.jpg',
      }),
    ).toBe('photo_xl.jpg');
  });

  it('falls back to the original file when no XL thumbnail exists', () => {
    expect(fullSizeTopoImageSrc({ thumbnailXL: null, path: 'photo.jpg' })).toBe(
      'photo.jpg',
    );
    expect(fullSizeTopoImageSrc({})).toBe('');
  });
});
