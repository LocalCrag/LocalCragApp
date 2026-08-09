import { normalizeApiHostUrl } from './runtime-api-host';

export const LEGACY_AUTH_STORAGE_KEY = 'LocalCragAuth';

/**
 * Host-scoped localStorage key for JWT persistence (INST-04 / D-09).
 */
export function authStorageKey(apiHost: string): string {
  return `${LEGACY_AUTH_STORAGE_KEY}:${normalizeApiHostUrl(apiHost)}`;
}

export type AuthStorageDeps = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function defaultDeps(): AuthStorageDeps {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  };
}

/**
 * One-time move of legacy global LocalCragAuth into the active host key.
 */
export function migrateLegacyAuthStorageIfNeeded(
  apiHost: string,
  deps: Partial<AuthStorageDeps> = {},
): void {
  const d = { ...defaultDeps(), ...deps };
  const key = authStorageKey(apiHost);
  if (d.getItem(key) !== null) {
    return;
  }
  const legacy = d.getItem(LEGACY_AUTH_STORAGE_KEY);
  if (legacy === null) {
    return;
  }
  d.setItem(key, legacy);
  d.removeItem(LEGACY_AUTH_STORAGE_KEY);
}

export function readAuthStorage(
  apiHost: string,
  deps: Partial<AuthStorageDeps> = {},
): string | null {
  const d = { ...defaultDeps(), ...deps };
  migrateLegacyAuthStorageIfNeeded(apiHost, d);
  return d.getItem(authStorageKey(apiHost));
}

export function writeAuthStorage(
  apiHost: string,
  value: string,
  deps: Partial<AuthStorageDeps> = {},
): void {
  const d = { ...defaultDeps(), ...deps };
  d.setItem(authStorageKey(apiHost), value);
  // Avoid leaving a stale global key after first namespaced write.
  d.removeItem(LEGACY_AUTH_STORAGE_KEY);
}

export function clearAuthStorage(
  apiHost: string,
  deps: Partial<AuthStorageDeps> = {},
): void {
  const d = { ...defaultDeps(), ...deps };
  d.removeItem(authStorageKey(apiHost));
  d.removeItem(LEGACY_AUTH_STORAGE_KEY);
}
