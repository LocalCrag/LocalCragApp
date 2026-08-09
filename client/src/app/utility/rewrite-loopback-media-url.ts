import { Capacitor } from '@capacitor/core';

/**
 * Emulator host-loopback alias. Android emulators cannot reach the developer's
 * machine via 127.0.0.1/localhost (that is the emulator itself); 10.0.2.2 is the
 * special alias for the host. Used only when the app runs as a native Capacitor
 * Android build so browser/web and iOS (future) behavior stay unchanged.
 */
const ANDROID_EMULATOR_HOST_LOOPBACK = '10.0.2.2';

/**
 * Matches absolute http(s) URLs whose host is the developer machine loopback.
 * Global + unanchored so it also rewrites URLs embedded in rich-text HTML
 * (blog posts, descriptions, rules) — not only standalone File.filename values.
 */
const LOOPBACK_HOST_IN_URL = /(https?:\/\/)(127\.0\.0\.1|localhost)(?=[:/])/gi;

/**
 * Rewrites absolute media URLs that point at the host loopback so they load on
 * an Android emulator. Server-serialized file URLs use S3_ACCESS_ENDPOINT
 * (typically http://127.0.0.1:9000/...), which is unreachable from the emulator.
 *
 * Accepts a single URL or a larger string (e.g. HTML) containing such URLs.
 * No-op on web, iOS, and when no loopback host is present.
 */
export function rewriteLoopbackMediaUrlForAndroid(
  url: string | null | undefined,
): string | null {
  if (url == null || url === '') {
    return url ?? null;
  }
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return url;
  }
  return url.replace(
    LOOPBACK_HOST_IN_URL,
    `$1${ANDROID_EMULATOR_HOST_LOOPBACK}`,
  );
}
