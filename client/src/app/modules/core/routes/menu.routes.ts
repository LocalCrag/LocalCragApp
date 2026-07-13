import { Routes } from '@angular/router';
import { MenuPageDetailComponent } from '../../menu-pages/menu-page-detail/menu-page-detail.component';
import { isModerator } from '../../../guards/is-moderator';

export const menuRoutes: Routes = [
  {
    path: 'pages',
    loadComponent: () =>
      import('../../menu-pages/menu-pages-list/menu-pages-list.component').then(
        (m) => m.MenuPagesListComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: 'pages/create-menu-page',
    loadComponent: () =>
      import('../../menu-pages/menu-pages-form/menu-pages-form.component').then(
        (m) => m.MenuPagesFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: 'pages/:menu-page-slug',
    component: MenuPageDetailComponent,
  },
  {
    path: 'pages/:menu-page-slug/edit',
    loadComponent: () =>
      import('../../menu-pages/menu-pages-form/menu-pages-form.component').then(
        (m) => m.MenuPagesFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: 'menu-items',
    loadComponent: () =>
      import('../../menu-pages/menu-items-list/menu-items-list.component').then(
        (m) => m.MenuItemsListComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: 'menu-items/create-menu-item/:position',
    loadComponent: () =>
      import('../../menu-pages/menu-items-form/menu-items-form.component').then(
        (m) => m.MenuItemsFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: 'menu-items/:menu-item-id/edit',
    loadComponent: () =>
      import('../../menu-pages/menu-items-form/menu-items-form.component').then(
        (m) => m.MenuItemsFormComponent,
      ),
    canActivate: [isModerator],
  },
];
