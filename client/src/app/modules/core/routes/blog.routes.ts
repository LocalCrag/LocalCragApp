import { Routes } from '@angular/router';
import { PostListComponent } from '../../blog/post-list/post-list.component';
import { PostDetailComponent } from '../../blog/post-detail/post-detail.component';
import { isModerator } from '../../../guards/is-moderator';
import { ObjectType } from '../../../models/object';

export const blogRoutes: Routes = [
  {
    path: 'news',
    component: PostListComponent,
  },
  {
    path: 'news/create-post',
    loadComponent: () =>
      import('../../blog/post-form/post-form.component').then(
        (m) => m.PostFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: 'news/:post-slug/edit',
    loadComponent: () =>
      import('../../blog/post-form/post-form.component').then(
        (m) => m.PostFormComponent,
      ),
    canActivate: [isModerator],
  },
  {
    path: 'news/:post-slug',
    component: PostDetailComponent,
    data: { objectType: ObjectType.Post },
  },
];
