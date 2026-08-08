import packageInfo from '../../package.json';

/** Compile-time false in prod — DCE drops mock GPS dynamic import. */
export const mockGpsRecording = false;

export const environment = {
  production: true,
  apiHost: '',
  skippedSlug: '_default',
  version: packageInfo.version,
};
