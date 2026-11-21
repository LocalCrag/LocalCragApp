import { Injectable, inject, DestroyRef } from '@angular/core';
import { Translation, TranslocoService } from '@jsverse/transloco';
import { LANGUAGE_CODES, LanguageCode } from '../../utility/types/language';
import { forkJoin, Observable, BehaviorSubject, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { selectInstanceLanguage } from '../../ngrx/selectors/instance-settings.selectors';
import { Actions, ofType } from '@ngrx/effects';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { loginSuccess } from '../../ngrx/actions/auth.actions';
import { filter, finalize, map, take, tap } from 'rxjs/operators';
import {
  readLocalStorageItem,
  writeLocalStorageItem,
} from '../../utility/local-storage';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private store = inject(Store);
  private transloco = inject(TranslocoService);
  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);
  private gymMode = false;

  // Language of the instance
  private instanceLanguage: LanguageCode;
  // Language of a registered user
  private userLanguage: LanguageCode;
  // Either userLanguage or selected language for anonymous users
  private preferredLanguage: LanguageCode;
  // Browser language (if existing in supported languages)
  readonly browserLanguage: LanguageCode;
  // Currently rendered language, can contain '-gym' suffix
  private renderedLanguage: string;

  // Observable that emits whenever the currently rendered language changes.
  private renderedLanguageSubject = new BehaviorSubject<string | null>(null);
  readonly renderedLanguage$ = this.renderedLanguageSubject.asObservable();
  /** In-flight language loads. Toasts wait so they are not translated against an empty catalog. */
  private pendingLanguageLoads = 0;
  private languageReadySubject = new BehaviorSubject<void>(undefined);

  constructor() {
    this.browserLanguage = navigator.language.slice(0, 2) as LanguageCode;
    if (!LANGUAGE_CODES.includes(this.browserLanguage)) {
      this.browserLanguage = null;
    }
  }

  /**
   * Calculates the language code that should be rendered based on priority:
   * user > preferred > browser > instance
   */
  get calculatedLanguage(): LanguageCode {
    return (
      this.preferredLanguage ||
      this.userLanguage ||
      this.browserLanguage ||
      this.instanceLanguage
    );
  }

  /**
   * Sets the instance language.
   * @param lang The language code to set as instance language.
   * @param skipChangeLanguage If true, the language change will not be triggered.
   */
  setInstanceLanguage(lang: LanguageCode, skipChangeLanguage = false) {
    this.instanceLanguage = lang;
    if (!skipChangeLanguage) {
      this.changeLanguage().subscribe();
    }
  }

  /**
   * Sets the user language.
   * @param lang The language code to set as user language.
   */
  setUserLanguage(lang: LanguageCode) {
    this.userLanguage = lang;
    this.preferredLanguage = lang;
    // In contrast to setInstanceLanguage and setPreferredLanguage, we always want to change language here
    // as this is never called during app initialization and thus doesn't trigger a redundant / race condition change
    this.changeLanguage().subscribe();

    // Persist preference so user language stays after logging out
    writeLocalStorageItem('preferredLanguage', lang);
  }

  /**
   * Sets the preferred language.
   * @param lang The language code to set as preferred language.
   * @param skipChangeLanguage If true, the language change will not be triggered.
   */
  setPreferredLanguage(lang: LanguageCode, skipChangeLanguage = false) {
    this.preferredLanguage = lang;
    if (!skipChangeLanguage) {
      this.changeLanguage().subscribe();
    }

    // Persist preference so it can be restored on next visit for anonymous users
    writeLocalStorageItem('preferredLanguage', lang);
  }

  /**
   * Changes the app language based on user, preferred and instance language and browser settings.
   */
  changeLanguage() {
    // Set language based on priority: user > preferred > browser > instance
    const lang = this.calculatedLanguage;

    const rendered = this.gymMode ? `${lang}-gym` : lang;
    // Do nothing if current language is the same
    if (this.renderedLanguage === rendered) {
      return of([]);
    }

    // Load the catalog before activating the language. Activating first makes
    // translate() return raw keys until the file arrives, which is what the
    // login toast was showing.
    this.pendingLanguageLoads++;
    return this.preloadScopes(lang).pipe(
      tap(() => {
        this.transloco.setFallbackLangForMissingTranslation({
          fallbackLang: lang,
        });
        this.transloco.setActiveLang(rendered);
        this.renderedLanguage = rendered;
        this.renderedLanguageSubject.next(this.renderedLanguage);
      }),
      finalize(() => {
        this.pendingLanguageLoads = Math.max(0, this.pendingLanguageLoads - 1);
        if (this.pendingLanguageLoads === 0) {
          this.languageReadySubject.next();
        }
      }),
    );
  }

  /**
   * Emits when no language change is still loading its translation files.
   */
  whenTranslationsReady(): Observable<void> {
    if (this.pendingLanguageLoads === 0) {
      return of(undefined);
    }
    return this.languageReadySubject.pipe(
      filter(() => this.pendingLanguageLoads === 0),
      take(1),
    );
  }

  /**
   * Initializes app language settings:
   * - Init instance and preferred language (user or selected language from nav select, both stored in local storage)
   * - Trigger language change
   * - Then listen for login events to set user language and instance language changes for dynamic changes
   * @param instanceLanguage The instances default language.
   */
  initApp(instanceLanguage: LanguageCode): Observable<any> {
    this.setInstanceLanguage(instanceLanguage, true);
    this.restorePreferredLanguage();
    return this.changeLanguage().pipe(
      map(() => {
        this.store.select(selectInstanceLanguage).subscribe((language) => {
          if (language) {
            this.setInstanceLanguage(language);
          }
        });
        this.actions$
          .pipe(ofType(loginSuccess), takeUntilDestroyed(this.destroyRef))
          .subscribe((action) => {
            this.setUserLanguage(action.loginResponse.user.accountLanguage);
          });
      }),
    );
  }

  /**
   * Restores preferred language from local storage.
   * Can either be user language (logged in) or selected language (anonymous).
   */
  restorePreferredLanguage() {
    const saved = readLocalStorageItem('preferredLanguage');
    if (!saved) return;
    this.setPreferredLanguage(saved as LanguageCode, true);
  }

  /**
   * Loads all translation scopes for the given language.
   * @param lang Language code for which to load the scopes.
   */
  preloadScopes(lang: LanguageCode): Observable<Translation[]> {
    return forkJoin(
      [
        '',
        'crag/',
        'sector/',
        'area/',
        'line/',
        'topoImage/',
        'linePath/',
        'maps/',
        'closableForm/',
        'topoQuality/',
      ].flatMap((path) => [
        this.transloco.load(path + lang),
        ...(this.gymMode ? [this.transloco.load(path + lang + '-gym')] : []),
      ]),
    );
  }
}
