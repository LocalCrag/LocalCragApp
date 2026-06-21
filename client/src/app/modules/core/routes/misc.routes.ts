import { Routes } from '@angular/router';
import { TodoListComponent } from '../../todo/todo-list/todo-list.component';
import { SentryTestComponent } from '../sentry-test/sentry-test.component';
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
    component: SentryTestComponent,
    data: defaultBg(),
  },
  {
    path: 'todos',
    component: TodoListComponent,
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
