import {
  galleryColumnCount,
  galleryImageAspectRatio,
  galleryImageWeight,
  GALLERY_MASONRY_CHROME,
  packMasonryColumns,
} from './gallery-masonry';

describe('gallery masonry', () => {
  it('uses the previous gallery breakpoints', () => {
    expect(galleryColumnCount(767)).toBe(1);
    expect(galleryColumnCount(768)).toBe(2);
    expect(galleryColumnCount(1279)).toBe(2);
    expect(galleryColumnCount(1280)).toBe(3);
  });

  it('keeps a single column in source order', () => {
    const columns = packMasonryColumns(
      [
        { item: 'a', weight: 2 },
        { item: 'b', weight: 1 },
        { item: 'c', weight: 1 },
      ],
      1,
    );

    expect(columns).toEqual([['a', 'b', 'c']]);
  });

  it('puts the next short items in the shorter column', () => {
    const columns = packMasonryColumns(
      [
        { item: 'tall', weight: 2 },
        { item: 'short-a', weight: 1 },
        { item: 'short-b', weight: 1 },
      ],
      2,
    );

    expect(columns).toEqual([['tall'], ['short-a', 'short-b']]);
  });

  it('does not move earlier items when another page is appended', () => {
    const firstPage = [
      { item: 'a', weight: 2 },
      { item: 'b', weight: 1 },
      { item: 'c', weight: 1 },
    ];
    const before = packMasonryColumns(firstPage, 2);
    const after = packMasonryColumns(
      [...firstPage, { item: 'd', weight: 1 }],
      2,
    );

    expect(after[0].slice(0, before[0].length)).toEqual(before[0]);
    expect(after[1].slice(0, before[1].length)).toEqual(before[1]);
    expect(after.flat()).toContain('d');
  });

  it('treats a non-positive column count as one column', () => {
    expect(packMasonryColumns([{ item: 'a', weight: 1 }], 0)).toEqual([['a']]);
  });

  it('derives aspect ratio and weight from the file dimensions', () => {
    expect(galleryImageAspectRatio(3000, 4000)).toBe('3000 / 4000');
    expect(galleryImageWeight(3000, 4000)).toBeCloseTo(
      4000 / 3000 + GALLERY_MASONRY_CHROME,
    );
  });

  it('falls back to a 4:3 frame when dimensions are missing', () => {
    expect(galleryImageAspectRatio(0, 100)).toBe('4 / 3');
    expect(galleryImageWeight(null, null)).toBeCloseTo(
      3 / 4 + GALLERY_MASONRY_CHROME,
    );
  });
});
