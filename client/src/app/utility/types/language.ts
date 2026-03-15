import { marker } from '@jsverse/transloco-keys-manager/marker';

export const LANGUAGE_CODES = [
  marker('de'),
  marker('en'),
  marker('it'),
] as const;

export type LanguageCode = (typeof LANGUAGE_CODES)[number];
