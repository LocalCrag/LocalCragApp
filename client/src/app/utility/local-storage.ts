/**
 * Safe access to `window.localStorage`.
 *
 * When cookies or site data are blocked, reading the `localStorage` property
 * throws `SecurityError` ("Access is denied for this document"). `typeof
 * localStorage` throws as well, so it is not a safe guard.
 */

type SentryLikeEvent = {
  message?: string;
  exception?: {
    values?: Array<{ type?: string; value?: string }>;
  };
};

/** Chrome's message when the document may not read `localStorage`. */
export const LOCAL_STORAGE_ACCESS_DENIED_PATTERN =
  /Failed to read the 'localStorage' property from 'Window'/i;

let accessDenied: boolean | null = null;

/**
 * True when reading storage throws or the storage object is missing.
 * The getter is injectable so tests can simulate a denied document.
 */
export function probeLocalStorageAccess(
  read: () => Storage | null | undefined,
): boolean {
  try {
    const storage = read();
    if (!storage) {
      return true;
    }
    // Some browsers throw on the first operation rather than the getter.
    storage.getItem('preferredLanguage');
    return false;
  } catch {
    return true;
  }
}

/**
 * True when this document cannot use localStorage.
 * False outside a browser, where storage is simply absent.
 */
export function isLocalStorageAccessDenied(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  if (accessDenied === null) {
    accessDenied = probeLocalStorageAccess(() => window.localStorage);
  }
  return accessDenied;
}

/** The document storage, or null when access is denied. */
export function getLocalStorage(): Storage | null {
  if (isLocalStorageAccessDenied()) {
    return null;
  }
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
}

/** Reads one key. Returns null when storage is denied or the read throws. */
export function readLocalStorageItem(key: string): string | null {
  try {
    return getLocalStorage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

/** Writes one key. No-ops when storage is denied or the write throws. */
export function writeLocalStorageItem(key: string, value: string): void {
  try {
    getLocalStorage()?.setItem(key, value);
  } catch {
    // Denied access or quota. The storage banner covers denial.
  }
}

/** Removes one key. No-ops when storage is denied or the write throws. */
export function removeLocalStorageItem(key: string): void {
  try {
    getLocalStorage()?.removeItem(key);
  } catch {
    // Denied access or quota. The storage banner covers denial.
  }
}

/**
 * True for the SecurityError Sentry reported when localStorage is blocked.
 */
export function isLocalStorageAccessError(error: unknown): boolean {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : '';
  if (!/localStorage/i.test(message)) {
    return false;
  }
  if (typeof error === 'string') {
    return /denied|insecure/i.test(message);
  }
  if (!(error instanceof Error)) {
    return false;
  }
  return (
    error.name === 'SecurityError' || /denied|insecure/i.test(error.message)
  );
}

/**
 * True when a Sentry event is the handled localStorage access denial.
 */
export function isLocalStorageAccessDeniedEvent(
  event: SentryLikeEvent,
): boolean {
  if (event.message && isLocalStorageAccessError(event.message)) {
    return true;
  }
  for (const value of event.exception?.values ?? []) {
    if (!value.value || !/localStorage/i.test(value.value)) {
      continue;
    }
    if (
      value.type === 'SecurityError' ||
      /denied|insecure/i.test(value.value)
    ) {
      return true;
    }
  }
  return false;
}
