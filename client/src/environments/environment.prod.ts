import packageInfo from '../../package.json';
import { buildVersion } from './build-info';

/** Compile-time false in prod — DCE drops mock GPS dynamic import. */
export const mockGpsRecording = false;

export const environment = {
  production: true,
  apiHost: '',
  skippedSlug: '_default',
  version: buildVersion ?? packageInfo.version,
};
