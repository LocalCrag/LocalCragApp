import { HttpErrorResponse } from '@angular/common/http';
import {
  isChunkLoadError,
  isNetworkConnectivityError,
  isOfflineRelatedError,
  shouldDropSentryEvent,
} from './sentry-network-error';

describe('sentry-network-error', () => {
  it('treats HttpErrorResponse status 0 as network failure', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://example.test/api',
    });
    expect(isNetworkConnectivityError(error)).toBe(true);
  });

  it('does not treat non-zero HttpErrorResponse as network failure', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Internal Server Error',
      url: 'https://example.test/api',
    });
    expect(isNetworkConnectivityError(error)).toBe(false);
  });

  it('matches Angular status-0 failure message strings', () => {
    expect(
      isNetworkConnectivityError(
        'Http failure response for https://example.test/api: 0 Unknown Error',
      ),
    ).toBe(true);
  });

  it('does not match non-zero Http failure messages', () => {
    expect(
      isNetworkConnectivityError(
        'Http failure response for https://example.test/api: 404 Not Found',
      ),
    ).toBe(false);
  });

  it('detects Failed to fetch dynamically imported module', () => {
    const error = new TypeError(
      'Failed to fetch dynamically imported module: https://example.test/gallery.component-CVC46X36.js',
    );
    expect(isChunkLoadError(error)).toBe(true);
    expect(isOfflineRelatedError(error)).toBe(true);
  });

  it('detects ChunkLoadError by name', () => {
    const error = new Error('Loading chunk 123 failed');
    error.name = 'ChunkLoadError';
    expect(isChunkLoadError(error)).toBe(true);
  });

  it('drops Sentry events via originalException status 0', () => {
    const error = new HttpErrorResponse({
      status: 0,
      statusText: 'Unknown Error',
      url: 'https://example.test/api',
    });
    expect(shouldDropSentryEvent({}, { originalException: error })).toBe(true);
  });

  it('drops Sentry events for chunk load failures', () => {
    expect(
      shouldDropSentryEvent({
        exception: {
          values: [
            {
              value:
                'Failed to fetch dynamically imported module: https://example.test/gallery.component-CVC46X36.js',
            },
          ],
        },
      }),
    ).toBe(true);
  });

  it('drops Sentry events via exception value message', () => {
    expect(
      shouldDropSentryEvent({
        exception: {
          values: [
            {
              value:
                'Http failure response for https://example.test/api: 0 Unknown Error',
            },
          ],
        },
      }),
    ).toBe(true);
  });

  it('keeps Sentry events for real HTTP failures', () => {
    expect(
      shouldDropSentryEvent({
        exception: {
          values: [
            {
              value:
                'Http failure response for https://example.test/api: 500 Server Error',
            },
          ],
        },
      }),
    ).toBe(false);
  });
});
