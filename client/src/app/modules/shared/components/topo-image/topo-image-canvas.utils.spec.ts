import { TopoImage } from '../../../../models/topo-image';
import { calculateSkeletonDimensions } from './topo-image-canvas.utils';

function topoImage(): TopoImage {
  return {
    image: {
      width: 4000,
      height: 2000,
      path: 'photo.jpg',
      thumbnailXS: 'photo_xs.jpg',
      thumbnailS: 'photo_s.jpg',
      thumbnailM: 'photo_m.jpg',
      thumbnailL: 'photo_l.jpg',
      thumbnailXL: 'photo_xl.jpg',
    },
  } as TopoImage;
}

describe('calculateSkeletonDimensions', () => {
  it('uses the L thumbnail for a column up to 1000px', () => {
    expect(calculateSkeletonDimensions(700, topoImage()).imageSrc).toBe(
      'photo_l.jpg',
    );
  });

  it('uses the XL thumbnail once the column is wider than the L file', () => {
    const result = calculateSkeletonDimensions(1400, topoImage());

    expect(result.imageSrc).toBe('photo_xl.jpg');
    expect(result.skeletonWidth).toBe(1400);
  });
});
