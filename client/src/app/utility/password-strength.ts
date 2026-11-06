import type { Score, TranslationKeys, ZxcvbnFactory } from '@zxcvbn-ts/core';

type LanguagePack = {
  dictionary: Record<string, string[]>;
  translations: TranslationKeys;
};

const languagePacks: Record<string, () => Promise<LanguagePack>> = {
  de: () => import('@zxcvbn-ts/language-de'),
  en: () => import('@zxcvbn-ts/language-en'),
  fr: () => import('@zxcvbn-ts/language-fr'),
  it: () => import('@zxcvbn-ts/language-it'),
};

let checker: ZxcvbnFactory | null = null;

/**
 * Loads zxcvbn with the common password list and the dictionary for the active language.
 * Dutch uses the English dictionary because zxcvbn has no Dutch pack.
 */
export async function configurePasswordStrength(
  language: string,
): Promise<void> {
  const [{ ZxcvbnFactory }, common, locale] = await Promise.all([
    import('@zxcvbn-ts/core'),
    import('@zxcvbn-ts/language-common'),
    (languagePacks[language] ?? languagePacks.en)(),
  ]);
  checker = new ZxcvbnFactory({
    dictionary: {
      ...common.dictionary,
      ...locale.dictionary,
    },
    graphs: common.adjacencyGraphs,
    translations: locale.translations,
  });
}

export interface PasswordScore {
  score: Score;
  warning: string;
}

/**
 * Scores a password with zxcvbn. Returns null until the dictionaries are loaded or the field is empty.
 */
export function scorePassword(
  password: string,
  userInputs: string[],
): PasswordScore | null {
  if (!checker || !password) {
    return null;
  }
  const result = checker.check(
    password,
    userInputs.filter((value) => value),
  );
  return {
    score: result.score,
    warning: result.feedback.warning ?? '',
  };
}
