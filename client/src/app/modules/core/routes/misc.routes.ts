import { Routes } from '@angular/router';
import { NotFoundComponent } from '../not-found/not-found.component';
import { isLoggedIn } from '../../../guards/is-logged-in';
import { authBg, defaultBg, notFoundBg } from './route-helpers';

export const rootRedirectRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'news',
  },
];

export const miscRoutes: Routes = [
  {
    path: 'sentry-test',
    loadComponent: () =>
      import('../sentry-test/sentry-test.component').then(
        (m) => m.SentryTestComponent,
      ),
    data: defaultBg(),
  },
  {
    path: 'todos',
    loadComponent: () =>
      import('../../todo/todo-list/todo-list.component').then(
        (m) => m.TodoListComponent,
      ),
    canActivate: [isLoggedIn],
    data: authBg(),
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
    data: notFoundBg(),
  },
];
