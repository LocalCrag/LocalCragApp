import packageInfo from '../../package.json';

export const environment = {
  production: false,
  apiHost: 'http://127.0.0.1:5000',
  skippedSlug: '_default',
  version: packageInfo.version,
  /**
   * When true, Rock Explorer Record mode simulates GPS movement
   * (~5 m/s walker seeded near the real fix) instead of live watchPosition.
   */
  mockGpsRecording: true,
};
