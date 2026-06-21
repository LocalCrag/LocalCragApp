import { Type } from '@angular/core';
import { CanActivateFn, Route, Routes } from '@angular/router';
import { StaticBackgroundImages } from '../background-image/background-image.component';
import { ObjectType } from '../../../models/object';
import { isModerator } from '../../../guards/is-moderator';
import { ModeratorTaskFormComponent } from '../../moderator-task/moderator-task-form/moderator-task-form.component';

export function defaultBg(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return { backgroundImagePath: StaticBackgroundImages.DEFAULT, ...extra };
}

export function authBg(
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  return { backgroundImagePath: StaticBackgroundImages.AUTH, ...extra };
}

export function notFoundBg(): Record<string, unknown> {
  return { backgroundImagePath: StaticBackgroundImages.NOT_FOUND };
}

interface OutletRouteOptions {
  canActivate?: CanActivateFn[];
  data?: Record<string, unknown>;
  pathMatch?: 'full' | 'prefix';
}

export function outletRoute(
  path: string,
  component: Type<unknown>,
  outlet: string,
  options: OutletRouteOptions = {},
): Route {
  return {
    path,
    ...(options.canActivate && { canActivate: options.canActivate }),
    children: [
      {
        path: '',
        component,
        outlet,
        ...(options.pathMatch && { pathMatch: options.pathMatch }),
        ...(options.data && { data: options.data }),
      },
    ],
  };
}

export function moderatorTaskFormRoutes(
  pathPrefix: string,
  scopeType: ObjectType,
): Routes {
  return [
    {
      path: `${pathPrefix}/moderator-tasks/create`,
      component: ModeratorTaskFormComponent,
      canActivate: [isModerator],
      data: defaultBg({ scopeType }),
    },
    {
      path: `${pathPrefix}/moderator-tasks/:task-id/edit`,
      component: ModeratorTaskFormComponent,
      canActivate: [isModerator],
      data: defaultBg({ scopeType }),
    },
  ];
}
