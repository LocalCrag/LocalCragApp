import { Routes } from '@angular/router';
import { PostListComponent } from '../../blog/post-list/post-list.component';
import { PostFormComponent } from '../../blog/post-form/post-form.component';
import { PostDetailComponent } from '../../blog/post-detail/post-detail.component';
import { isModerator } from '../../../guards/is-moderator';
import { ObjectType } from '../../../models/object';
import { defaultBg } from './route-helpers';

export const blogRoutes: Routes = [
  {
    path: 'news',
    component: PostListComponent,
    data: defaultBg(),
  },
  {
    path: 'news/create-post',
    component: PostFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'news/:post-slug/edit',
    component: PostFormComponent,
    canActivate: [isModerator],
    data: defaultBg(),
  },
  {
    path: 'news/:post-slug',
    component: PostDetailComponent,
    data: defaultBg({ objectType: ObjectType.Post }),
  },
];
