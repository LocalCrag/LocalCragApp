import packageInfo from '../../package.json';

/**
 * Top-level flag (not nested under `environment`) so production builds can
 * dead-code-eliminate dynamic imports gated on this constant.
 */
export const mockGpsRecording = true;

export const environment = {
  production: false,
  apiHost: 'http://127.0.0.1:5000',
  skippedSlug: '_default',
  version: packageInfo.version,
};
