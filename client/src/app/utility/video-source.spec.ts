import { providerForUrl, videoEmbed } from './video-source';

describe('video sources', () => {
  it('recognizes YouTube, Vimeo, and Instagram links', () => {
    expect(providerForUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'youtube',
    );
    expect(providerForUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('youtube');
    expect(
      providerForUrl('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),
    ).toBe('youtube');
    expect(
      providerForUrl('https://notyoutube-nocookie.com/embed/dQw4w9WgXcQ'),
    ).toBeNull();
    expect(providerForUrl('https://vimeo.com/123456789')).toBe('vimeo');
    expect(providerForUrl('https://www.instagram.com/reel/Abcde12345/')).toBe(
      'instagram',
    );
    expect(providerForUrl('https://example.com/watch')).toBeNull();
  });

  it('builds embed URLs and keeps a start time', () => {
    expect(
      videoEmbed({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        startSeconds: 83,
      }).embedUrl,
    ).toBe('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?start=83');
    expect(
      videoEmbed({ url: 'https://vimeo.com/123456789', startSeconds: 12 })
        .embedUrl,
    ).toBe('https://player.vimeo.com/video/123456789#t=12s');
    expect(
      videoEmbed({
        url: 'https://www.instagram.com/p/Abcde12345/',
        startSeconds: 40,
      }),
    ).toEqual({
      provider: 'instagram',
      embedUrl: 'https://www.instagram.com/p/Abcde12345/embed',
      startSeconds: 0,
    });
    expect(
      videoEmbed({
        url: 'https://files.example/video.mp4',
        source: 'upload',
        fileId: 'file-1',
        startSeconds: 4,
      }).provider,
    ).toBe('upload');
  });
});
