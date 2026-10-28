import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { Store } from '@ngrx/store';
import { NotFoundComponent } from '../not-found/not-found.component';
import { isLoggedIn } from '../../../guards/is-logged-in';
import { isMember } from '../../../guards/is-member';
import { isModerator } from '../../../guards/is-moderator';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { landingPagePath } from './landing-page';
import { rockExplorerMatcher } from './rock-explorer.matcher';

function redirectToConfiguredLandingPage(): string {
  const settings = inject(Store).selectSignal(selectInstanceSettingsState)();
  return landingPagePath(
    settings.landingPage,
    settings.skippedHierarchyLayers,
    settings.landingPageSlug,
  );
}

export const rootRedirectRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: redirectToConfiguredLandingPage,
  },
];

export const miscRoutes: Routes = [
  {
    path: 'topo-quality',
    loadComponent: () =>
      import('../../topo-quality/topo-quality-page/topo-quality-page.component').then(
        (m) => m.TopoQualityPageComponent,
      ),
    canActivate: [isMember],
    data: { pageTitleHero: true },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('../../topo-quality/topo-quality-tree/topo-quality-tree.component').then(
            (m) => m.TopoQualityTreeComponent,
          ),
        data: { pageTitleHost: false },
      },
      {
        path: 'ranking',
        loadComponent: () =>
          import('../../topo-quality/topo-quality-ranking/topo-quality-ranking.component').then(
            (m) => m.TopoQualityRankingComponent,
          ),
        canActivate: [isModerator],
        data: { pageTitleHost: false },
      },
      {
        path: 'trends',
        loadComponent: () =>
          import('../../topo-quality/topo-quality-trends/topo-quality-trends.component').then(
            (m) => m.TopoQualityTrendsComponent,
          ),
        canActivate: [isModerator],
        data: { pageTitleHost: false },
      },
      {
        path: 'region',
        loadComponent: () =>
          import('../../topo-quality/topo-quality-detail/topo-quality-detail.component').then(
            (m) => m.TopoQualityDetailComponent,
          ),
        data: { level: 'region', pageTitleHost: false },
      },
      {
        path: 'crag/:cragSlug',
        loadComponent: () =>
          import('../../topo-quality/topo-quality-detail/topo-quality-detail.component').then(
            (m) => m.TopoQualityDetailComponent,
          ),
        data: { level: 'crag', pageTitleHost: false },
      },
      {
        path: 'crag/:cragSlug/sector/:sectorSlug',
        loadComponent: () =>
          import('../../topo-quality/topo-quality-detail/topo-quality-detail.component').then(
            (m) => m.TopoQualityDetailComponent,
          ),
        data: { level: 'sector', pageTitleHost: false },
      },
      {
        path: 'crag/:cragSlug/sector/:sectorSlug/area/:areaSlug',
        loadComponent: () =>
          import('../../topo-quality/topo-quality-detail/topo-quality-detail.component').then(
            (m) => m.TopoQualityDetailComponent,
          ),
        data: { level: 'area', pageTitleHost: false },
      },
    ],
  },
  {
    path: 'sentry-test',
    loadComponent: () =>
      import('../sentry-test/sentry-test.component').then(
        (m) => m.SentryTestComponent,
      ),
    data: { hidePageTitle: true },
  },
  {
    path: 'todos',
    loadComponent: () =>
      import('../../todo/todo-list/todo-list.component').then(
        (m) => m.TodoListComponent,
      ),
    canActivate: [isLoggedIn],
  },
  {
    matcher: rockExplorerMatcher,
    loadComponent: () =>
      import('../../rock-explorer/rock-explorer/rock-explorer.component').then(
        (m) => m.RockExplorerComponent,
      ),
    canActivate: [isMember],
    data: { fullscreenMap: true },
  },
];

export const ascentsRedirectRoute: Routes = [
  {
    path: 'ascents',
    redirectTo: 'topo/ascents',
  },
];

export const rankingRedirectRoute: Routes = [
  {
    path: 'ranking',
    redirectTo: 'topo/ranking',
  },
];

export const notFoundRoute: Routes = [
  {
    component: NotFoundComponent,
    path: '**',
    data: { hidePageTitle: true },
  },
];
