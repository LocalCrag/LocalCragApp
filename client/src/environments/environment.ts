import packageInfo from '../../package.json';

export const environment = {
  production: false,
  apiHost: 'http://127.0.0.1:5000',
  language: 'de',
  skippedSlug: '_default',
  version: packageInfo.version,
};
