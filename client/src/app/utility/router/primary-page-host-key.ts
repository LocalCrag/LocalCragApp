import { ActivatedRouteSnapshot, PRIMARY_OUTLET } from '@angular/router';

/**
 * Stable key for the deepest primary-outlet route that defines a page host
 * (`component` / `loadComponent`). Used to detect real page changes vs tab
 * navigations within the same host.
 */
export function getPrimaryPageHostKey(root: ActivatedRouteSnapshot): string {
  let hostRoute: ActivatedRouteSnapshot | null = null;

  const visit = (route: ActivatedRouteSnapshot) => {
    if (routeDefinesPageHost(route)) {
      hostRoute = route;
    }

    for (const child of route.children) {
      if (child.outlet === PRIMARY_OUTLET) {
        visit(child);
      }
    }
  };

  visit(root);

  if (!hostRoute) {
    return '';
  }

  return hostRoute.pathFromRoot
    .map((segment) => segment.routeConfig?.path ?? '')
    .join('/');
}

function routeDefinesPageHost(route: ActivatedRouteSnapshot): boolean {
  const config = route.routeConfig;
  return !!(config?.component || config?.loadComponent);
}
