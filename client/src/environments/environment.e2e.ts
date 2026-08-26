import packageInfo from '../../package.json';

export const mockGpsRecording = false;

export const environment = {
  production: false,
  apiHost: 'http://localhost:5001',
  skippedSlug: '_default',
  version: packageInfo.version,
};
