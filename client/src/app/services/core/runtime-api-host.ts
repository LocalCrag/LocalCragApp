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
