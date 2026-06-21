import { Routes } from '@angular/router';
import {
  rootRedirectRoutes,
  miscRoutes,
  ascentsRedirectRoute,
  rankingRedirectRoute,
  notFoundRoute,
} from './routes/misc.routes';
import { blogRoutes } from './routes/blog.routes';
import { menuRoutes } from './routes/menu.routes';
import { authRoutes } from './routes/auth.routes';
import { adminRoutes } from './routes/admin.routes';
import { userRoutes } from './routes/user.routes';
import { topoRoutes } from './routes/topo';

export const appRoutes: Routes = [
  ...rootRedirectRoutes,
  ...blogRoutes,
  ...miscRoutes,
  ...menuRoutes,
  ...authRoutes,
  ...adminRoutes,
  ...userRoutes,
  ...ascentsRedirectRoute,
  ...topoRoutes,
  ...rankingRedirectRoute,
  ...notFoundRoute,
];
