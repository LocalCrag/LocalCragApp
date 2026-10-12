import {
  galleryPreviewIndexAfterRemoval,
  galleryPreviewSwipeDirection,
  stepGalleryPreview,
} from './gallery-preview';

describe('gallery preview', () => {
  it('moves to the neighbor inside the loaded images', () => {
    expect(
      stepGalleryPreview({
        index: 1,
        count: 4,
        hasNextPage: true,
        direction: 1,
      }),
    ).toEqual({ type: 'move', index: 2 });
    expect(
      stepGalleryPreview({
        index: 2,
        count: 4,
        hasNextPage: true,
        direction: -1,
      }),
    ).toEqual({ type: 'move', index: 1 });
  });

  it('loads the next page when moving past the last loaded image', () => {
    expect(
      stepGalleryPreview({
        index: 9,
        count: 10,
        hasNextPage: true,
        direction: 1,
      }),
    ).toEqual({ type: 'load-next', index: 10 });
  });

  it('wraps after the last image once every page is loaded', () => {
    expect(
      stepGalleryPreview({
        index: 2,
        count: 3,
        hasNextPage: false,
        direction: 1,
      }),
    ).toEqual({ type: 'move', index: 0 });
    expect(
      stepGalleryPreview({
        index: 0,
        count: 3,
        hasNextPage: true,
        direction: -1,
      }),
    ).toEqual({ type: 'move', index: 2 });
  });

  it('does not move when a single image is the whole gallery', () => {
    expect(
      stepGalleryPreview({
        index: 0,
        count: 1,
        hasNextPage: false,
        direction: 1,
      }),
    ).toBeNull();
    expect(
      stepGalleryPreview({
        index: 0,
        count: 1,
        hasNextPage: false,
        direction: -1,
      }),
    ).toBeNull();
  });

  it('treats a mostly horizontal swipe as next or previous', () => {
    expect(galleryPreviewSwipeDirection(100, 40, 20, 50)).toBe(1);
    expect(galleryPreviewSwipeDirection(20, 40, 100, 30)).toBe(-1);
    expect(galleryPreviewSwipeDirection(100, 40, 70, 40)).toBeNull();
    expect(galleryPreviewSwipeDirection(100, 40, 20, 160)).toBeNull();
  });

  it('keeps the following image in view when the open one is removed', () => {
    expect(galleryPreviewIndexAfterRemoval(2, 2, 4)).toBe(2);
    expect(galleryPreviewIndexAfterRemoval(2, 0, 4)).toBe(1);
    expect(galleryPreviewIndexAfterRemoval(3, 3, 3)).toBe(2);
    expect(galleryPreviewIndexAfterRemoval(0, 0, 0)).toBeNull();
  });
});
