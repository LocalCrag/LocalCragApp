import packageInfo from '../../package.json';

export const environment = {
  production: false,
  apiHost: 'http://127.0.0.1:5000',
  skippedSlug: '_default',
  version: packageInfo.version,
};
