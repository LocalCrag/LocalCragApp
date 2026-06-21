import { Routes } from '@angular/router';
import { MenuPagesListComponent } from '../../menu-pages/menu-pages-list/menu-pages-list.component';
import { MenuPagesFormComponent } from '../../menu-pages/menu-pages-form/menu-pages-form.component';
import { MenuPageDetailComponent } from '../../menu-pages/menu-page-detail/menu-page-detail.component';
import { MenuItemsListComponent } from '../../menu-pages/menu-items-list/menu-items-list.component';
import { MenuItemsFormComponent } from '../../menu-pages/menu-items-form/menu-items-form.component';
import { isModerator } from '../../../guards/is-moderator';
import { defaultBg } from './route-helpers';

export const menuRoutes: Routes = [
  {
    path: 'pages',
    component: MenuPagesListComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'pages/create-menu-page',
    component: MenuPagesFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'pages/:menu-page-slug',
    component: MenuPageDetailComponent,
    data: defaultBg(),
  },
  {
    path: 'pages/:menu-page-slug/edit',
    component: MenuPagesFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'menu-items',
    component: MenuItemsListComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'menu-items/create-menu-item/:position',
    component: MenuItemsFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'menu-items/:menu-item-id/edit',
    component: MenuItemsFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
];
