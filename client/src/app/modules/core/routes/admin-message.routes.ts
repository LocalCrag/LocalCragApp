import { Routes } from '@angular/router';
import { isAdmin } from '../../../guards/is-admin';

export const adminMessageRoutes: Routes = [
  {
    path: 'admin-messages',
    loadComponent: () =>
      import('../../admin-messages/admin-messages-list/admin-messages-list.component').then(
        (m) => m.AdminMessagesListComponent,
      ),
    canActivate: [isAdmin],
  },
  {
    path: 'admin-messages/create',
    loadComponent: () =>
      import('../../admin-messages/admin-messages-form/admin-messages-form.component').then(
        (m) => m.AdminMessagesFormComponent,
      ),
    canActivate: [isAdmin],
  },
  {
    path: 'admin-messages/:message-id/edit',
    loadComponent: () =>
      import('../../admin-messages/admin-messages-form/admin-messages-form.component').then(
        (m) => m.AdminMessagesFormComponent,
      ),
    canActivate: [isAdmin],
  },
];
