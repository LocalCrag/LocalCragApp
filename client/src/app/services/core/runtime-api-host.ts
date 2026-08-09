import { InjectionToken } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../../environments/environment';

/**
 * Preferences key for the single runtime API base URL (no trailing /api/).
 * Phase 16's instance picker MUST reuse this exact key (D-03).
 */
export const API_HOST_PREFERENCE_KEY = 'apiHost';

/**
 * Resolved once per app load before Angular bootstraps (see main.ts).
 * ApiService builds all `/api/` URLs from this value (INST-01).
 */
export const RUNTIME_API_HOST = new InjectionToken<string>('RUNTIME_API_HOST');

/** Testable seams for resolveApiHost (Karma may duplicate @capacitor/core modules). */
export type ResolveApiHostDeps = {
  isNativePlatform: () => boolean;
  getPreference: (options: {
    key: string;
  }) => Promise<{ value: string | null }>;
  setPreference: (options: { key: string; value: string }) => Promise<void>;
  defaultHost: string;
};

function defaultResolveApiHostDeps(): ResolveApiHostDeps {
  return {
    isNativePlatform: () => Capacitor.isNativePlatform(),
    getPreference: (options) => Preferences.get(options),
    setPreference: (options) => Preferences.set(options),
    defaultHost: environment.apiHost,
  };
}

/**
 * Trim and strip a trailing slash for consistency with environment.apiHost.
 */
export function normalizeApiHostUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '');
}

/**
 * True for RFC1918 / link-local IPv4 hosts used for local LAN debug
 * (physical device → Mac) and the Android emulator alias 10.0.2.2.
 */
function isPrivateOrEmulatorHttpHostname(hostname: string): boolean {
  if (hostname === '10.0.2.2' || hostname === 'localhost') {
    return true;
  }
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(hostname);
  if (!m) {
    return false;
  }
  const oct = m.slice(1).map((p) => Number(p));
  if (oct.some((n) => n > 255)) {
    return false;
  }
  const [a, b] = oct;
  // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 127.0.0.0/8
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

/**
 * HTTPS for real instances; cleartext HTTP only for emulator loopback (10.0.2.2)
 * and private LAN / localhost hosts (physical-device → local Flask).
 */
export function isAllowedApiHostUrl(url: string): boolean {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') {
      return true;
    }
    return (
      parsed.protocol === 'http:' &&
      isPrivateOrEmulatorHttpHostname(parsed.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Resolve the API base host for this process.
 * - Web: synchronous environment.apiHost (D-07), no Preferences.
 * - Native: Preferences-backed; seed from environment.apiHost when unset (D-01, D-02).
 */
export async function resolveApiHost(
  deps: Partial<ResolveApiHostDeps> = {},
): Promise<string> {
  const { isNativePlatform, getPreference, setPreference, defaultHost } = {
    ...defaultResolveApiHostDeps(),
    ...deps,
  };

  if (!isNativePlatform()) {
    return defaultHost;
  }
  const { value } = await getPreference({ key: API_HOST_PREFERENCE_KEY });
  if (value) {
    return value;
  }
  await setPreference({
    key: API_HOST_PREFERENCE_KEY,
    value: defaultHost,
  });
  return defaultHost;
}
