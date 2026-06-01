import { Pipe, PipeTransform } from '@angular/core';
import { User } from '../../../models/user';
import { Crag } from '../../../models/crag';
import { Sector } from '../../../models/sector';
import { Area } from '../../../models/area';
import { Line } from '../../../models/line';

@Pipe({
  name: 'entityLink',
})
export class EntityLinkPipe implements PipeTransform {
  transform(value: any): string {
    if (value instanceof User) {
      return `/users/${value.slug}`;
    }
    if (
      value instanceof Crag ||
      value instanceof Sector ||
      value instanceof Area ||
      value instanceof Line
    ) {
      return value.routerLink ?? '/';
    }
    return '/';
  }
}
