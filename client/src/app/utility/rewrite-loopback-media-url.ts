import { Capacitor } from '@capacitor/core';

/**
 * Host used to rewrite developer-machine loopback media URLs on Android.
 * Defaults to the emulator alias; overridden at bootstrap from the runtime API
 * host so physical devices using LAN IP or adb-reverse 127.0.0.1 keep working.
 */
let androidMediaLoopbackHost = '10.0.2.2';

/**
 * Matches absolute http(s) URLs whose host is the developer machine loopback.
 * Global + unanchored so it also rewrites URLs embedded in rich-text HTML
 * (blog posts, descriptions, rules) — not only standalone File.filename values.
 */
const LOOPBACK_HOST_IN_URL = /(https?:\/\/)(127\.0\.0\.1|localhost)(?=[:/])/gi;

/**
 * Point loopback media rewrites at the same machine as the runtime API host.
 * Call once after `resolveApiHost()` (see main.ts).
 *
 * - `http://10.0.2.2:5000` → media via `10.0.2.2` (emulator)
 * - `http://127.0.0.1:5000` → keep `127.0.0.1` (needs `adb reverse` for :9000)
 * - `http://192.168.x.x:5000` → media via that LAN IP (MinIO must listen on LAN)
 */
export function configureAndroidMediaHostRewrite(apiHost: string): void {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }
  try {
    const hostname = new URL(apiHost).hostname;
    if (!hostname) {
      return;
    }
    androidMediaLoopbackHost =
      hostname === 'localhost' ? '127.0.0.1' : hostname;
  } catch {
    // keep emulator default
  }
}

/** Test seam — reset rewrite host between specs. */
export function resetAndroidMediaHostRewriteForTests(): void {
  androidMediaLoopbackHost = '10.0.2.2';
}

/**
 * Rewrites absolute media URLs that point at the host loopback so they load on
 * Android. Server-serialized file URLs use S3_ACCESS_ENDPOINT
 * (typically http://127.0.0.1:9000/...), which is unreachable as-is from the
 * device/emulator unless rewritten (and, for 127.0.0.1, adb-reversed).
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
  return url.replace(LOOPBACK_HOST_IN_URL, `$1${androidMediaLoopbackHost}`);
}
