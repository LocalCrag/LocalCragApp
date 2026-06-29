import {
  DestroyRef,
  Injectable,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import {
  cleanupCredentials,
  newAuthCredentials,
} from '../../ngrx/actions/auth.actions';

export type ColorScheme = 'light' | 'dark' | 'system';

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
  private mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  private mediaListener = () => {
    if (this.colorScheme() === 'system') {
      this.applyDarkClass();
    }
  };

  init(): void {
    this.applyDarkClass();
    this.mediaQuery.addEventListener('change', this.mediaListener);

    this.actions$
      .pipe(ofType(newAuthCredentials), takeUntilDestroyed(this.destroyRef))
      .subscribe((action) => {
        this.applyColorScheme(action.loginResponse.user.accountColorScheme);
      });

    this.actions$
      .pipe(ofType(cleanupCredentials), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.applyColorScheme('system');
      });
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
}
