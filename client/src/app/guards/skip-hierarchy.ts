import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { AppState } from '../ngrx/reducers';
import { selectInstanceSettingsState } from '../ngrx/selectors/instance-settings.selectors';
import { environment } from '../../environments/environment';

/**
 * Generate a CanActivateFn for a given hierarchy skip scenario
 *
 * @param threshold Starting from which skippedHierarchyLayers setting (inclusive) this function will get active
 * @param routingPrefix prefixes of the target route
 * @param routingPostfix postfixes of the target route
 * @param dynamicRoute If true (default), adds skippedHierarchyLayers amount of environment.skippedSlug between prefix and postfix
 */
export function skipHierarchy(
  threshold: number,
  routingPrefix: string[],
  routingPostfix: string[] = [],
  dynamicRoute = true,
): CanActivateFn {
  return () => {
    const store = inject(Store<AppState>);
    const router = inject(Router);
    return store.pipe(
      select(selectInstanceSettingsState),
      map((instanceSettings) => {
        if (instanceSettings.skippedHierarchyLayers >= threshold) {
          const route = [];
          route.push(...routingPrefix);
          if (dynamicRoute) {
            for (let i = 0; i < instanceSettings.skippedHierarchyLayers; i++) {
              route.push(environment.skippedSlug);
            }
          }
          route.push(...routingPostfix);
          router.navigate(route, { skipLocationChange: true });
          return false;
        }
        return true;
      }),
    );
  };
}
