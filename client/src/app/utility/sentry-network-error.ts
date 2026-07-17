import { HttpErrorResponse } from '@angular/common/http';

/**
 * Detects client connectivity failures for Sentry filtering and the offline banner.
 *
 * These errors are not app bugs: the browser could not complete an HTTP call or
 * download a lazy chunk. Prefer request/chunk failure detection over `window.online`
 * / `offline` when deciding to show the offline UI — see OfflineAlertComponent.
 */

/**
 * Angular HttpClient status-0 message (offline / unreachable server), e.g.
 * "Http failure response for https://example/api: 0 Unknown Error"
 */
export const NETWORK_ERROR_MESSAGE_PATTERN =
  /Http failure response for .+: 0\b/i;

/**
 * Lazy-loaded JS chunk / dynamic import failures caused by bad network.
 */
export const CHUNK_LOAD_ERROR_PATTERNS: RegExp[] = [
  /Loading chunk [\w.-]+ failed/i,
  /Failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /Importing a module script failed/i,
];

/** Patterns passed to Sentry `ignoreErrors`. */
export const SENTRY_IGNORED_NETWORK_ERROR_PATTERNS: RegExp[] = [
  NETWORK_ERROR_MESSAGE_PATTERN,
  ...CHUNK_LOAD_ERROR_PATTERNS,
];

function unwrapError(error: unknown): unknown {
  if (
    error &&
    typeof error === 'object' &&
    'ngOriginalError' in error &&
    (error as { ngOriginalError: unknown }).ngOriginalError != null
  ) {
    return (error as { ngOriginalError: unknown }).ngOriginalError;
  }
  return error;
}

function errorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return '';
}

function messageMatchesChunkLoad(message: string): boolean {
  return CHUNK_LOAD_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Returns true when a lazy route/component chunk failed to download (typically offline).
 */
export function isChunkLoadError(error: unknown): boolean {
  const unwrapped = unwrapError(error);

  if (
    unwrapped &&
    typeof unwrapped === 'object' &&
    'name' in unwrapped &&
    (unwrapped as { name: unknown }).name === 'ChunkLoadError'
  ) {
    return true;
  }

  return messageMatchesChunkLoad(errorMessage(unwrapped));
}

/**
 * Returns true when the error indicates client connectivity failure rather than an app bug.
 */
export function isNetworkConnectivityError(error: unknown): boolean {
  const unwrapped = unwrapError(error);

  if (unwrapped instanceof HttpErrorResponse) {
    return unwrapped.status === 0;
  }

  const message = errorMessage(unwrapped);
  return NETWORK_ERROR_MESSAGE_PATTERN.test(message);
}

/**
 * Network HTTP failures or lazy chunk load failures — show offline UI / drop from Sentry.
 * Use this (failed request evidence) rather than `window.offline` to decide showing the banner.
 */
export function isOfflineRelatedError(error: unknown): boolean {
  return isNetworkConnectivityError(error) || isChunkLoadError(error);
}

type SentryLikeEvent = {
  message?: string;
  exception?: {
    values?: Array<{ value?: string }>;
  };
};

type SentryLikeHint = {
  originalException?: unknown;
};

function messageLooksLikeOfflineNoise(message: string): boolean {
  return (
    NETWORK_ERROR_MESSAGE_PATTERN.test(message) ||
    messageMatchesChunkLoad(message)
  );
}

/**
 * Decide whether a Sentry error event should be dropped as network noise.
 */
export function shouldDropSentryEvent(
  event: SentryLikeEvent,
  hint?: SentryLikeHint,
): boolean {
  if (
    hint?.originalException !== undefined &&
    isOfflineRelatedError(hint.originalException)
  ) {
    return true;
  }

  const messages: string[] = [];
  if (event.message) {
    messages.push(event.message);
  }
  for (const value of event.exception?.values ?? []) {
    if (value.value) {
      messages.push(value.value);
    }
  }

  return messages.some((message) => messageLooksLikeOfflineNoise(message));
}
