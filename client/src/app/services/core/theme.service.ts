import {
  DestroyRef,
  Injectable,
  Injector,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import {
  cleanupCredentials,
  newAuthCredentials,
} from '../../ngrx/actions/auth.actions';

export type ColorScheme = 'light' | 'dark' | 'system';

const GUEST_COLOR_SCHEME_STORAGE_KEY = 'preferredColorScheme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly colorScheme = signal<ColorScheme>('system');
  readonly isDarkMode = computed(() => {
    const scheme = this.colorScheme();
    return (
      scheme === 'dark' || (scheme === 'system' && this.mediaQuery.matches)
    );
  });

  private actions$ = inject(Actions);
  private destroyRef = inject(DestroyRef);
  private injector = inject(Injector);
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaListener = () => {
    if (this.colorScheme() === 'system') {
      this.applyDarkClass();
    }
  };

  init(): void {
    const guestScheme = this.readGuestColorScheme();
    if (guestScheme) {
      this.applyColorScheme(guestScheme);
    } else {
      this.applyDarkClass();
    }
    this.mediaQuery.addEventListener('change', this.mediaListener);

    this.actions$
      .pipe(ofType(newAuthCredentials), takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        this.applyColorScheme(action.loginResponse.user.accountColorScheme);
      });

    this.actions$
      .pipe(ofType(cleanupCredentials), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyColorScheme(this.readGuestColorScheme() ?? 'system');
      });

    this.syncNativeStatusBar();
  }

  toggleGuestColorScheme(): void {
    const next: ColorScheme = this.isDarkMode() ? 'light' : 'dark';
    this.applyColorScheme(next);
    localStorage.setItem(GUEST_COLOR_SCHEME_STORAGE_KEY, next);
  }

  applyColorScheme(scheme: ColorScheme): void {
    const normalized =
      scheme === 'light' || scheme === 'dark' || scheme === 'system'
        ? scheme
        : 'system';
    this.colorScheme.set(normalized);
    this.applyDarkClass();
  }

  private applyDarkClass(): void {
    const isDark =
      this.colorScheme() === 'dark' ||
      (this.colorScheme() === 'system' && this.mediaQuery.matches);
    document.documentElement.classList.toggle('lc-dark', isDark);
  }

  private readGuestColorScheme(): ColorScheme | null {
    const saved = localStorage.getItem(GUEST_COLOR_SCHEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    return null;
  }

  private syncNativeStatusBar(): void {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    effect(
      () => {
        const dark = this.isDarkMode();
        // Style.Dark means light content drawn on dark chrome.
        void StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
        void StatusBar.setBackgroundColor({ color: this.statusBarColor(dark) });
      },
      { injector: this.injector },
    );
  }

  /** Reads the theme surface the site header already uses, so native chrome cannot drift. */
  private statusBarColor(dark: boolean): string {
    const token = getComputedStyle(document.documentElement)
      .getPropertyValue('--p-content-background')
      .trim();
    return /^#[0-9a-fA-F]{6}$/.test(token)
      ? token
      : dark
        ? '#18181b'
        : '#ffffff';
  }
}
