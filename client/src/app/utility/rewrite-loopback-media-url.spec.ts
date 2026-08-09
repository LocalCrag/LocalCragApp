import { rewriteLoopbackMediaUrlForAndroid } from './rewrite-loopback-media-url';

describe('rewriteLoopbackMediaUrlForAndroid', () => {
  // Capacitor.isNativePlatform is false under Karma (browser), so these assert
  // the web no-op path. Native rewrite is covered by the Capacitor Android smoke
  // checkpoint (images load from MinIO via 10.0.2.2).
  it('returns null/empty unchanged', () => {
    expect(rewriteLoopbackMediaUrlForAndroid(null)).toBeNull();
    expect(rewriteLoopbackMediaUrlForAndroid(undefined)).toBeNull();
    expect(rewriteLoopbackMediaUrlForAndroid('')).toBe('');
  });

  it('leaves URLs unchanged in the browser test environment', () => {
    expect(
      rewriteLoopbackMediaUrlForAndroid(
        'http://127.0.0.1:9000/bucket/file.jpg',
      ),
    ).toBe('http://127.0.0.1:9000/bucket/file.jpg');
    expect(
      rewriteLoopbackMediaUrlForAndroid(
        'http://localhost:9000/bucket/file.jpg',
      ),
    ).toBe('http://localhost:9000/bucket/file.jpg');
    expect(
      rewriteLoopbackMediaUrlForAndroid(
        '<p><img src="http://127.0.0.1:9000/bucket/file.jpg"></p>',
      ),
    ).toBe('<p><img src="http://127.0.0.1:9000/bucket/file.jpg"></p>');
  });
});
