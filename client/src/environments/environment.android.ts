import packageInfo from '../../package.json';

export const mockGpsRecording = false;

export const environment = {
  production: false,
  apiHost: 'http://10.0.2.2:5000',
  skippedSlug: '_default',
  version: packageInfo.version,
};
