import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { AppState } from '../ngrx/reducers';
import { selectAuthState } from '../ngrx/selectors/auth.selectors';
import { selectInstanceSettingsState } from '../ngrx/selectors/instance-settings.selectors';

/**
 * Moderators can always open line and topo image creation.
 * Other logged-in users can open it when suggestions are enabled for them.
 */
export const canContributeTopo: CanActivateFn = () => {
  const store = inject(Store<AppState>);
  const router = inject(Router);
  return combineLatest([
    store.select(selectAuthState),
    store.select(selectInstanceSettingsState),
  ]).pipe(
    filter(
      ([auth, settings]) =>
        auth.authResolved && (!!auth.user?.moderator || settings.loaded),
    ),
    take(1),
    map(([auth, settings]) => {
      if (auth.user?.moderator) {
        return true;
      }
      if (
        auth.user &&
        settings.suggestionsEnabled &&
        auth.user.suggestionsEnabled
      ) {
        return true;
      }
      router.navigate(auth.user ? [''] : ['/login']);
      return false;
    }),
  );
};
