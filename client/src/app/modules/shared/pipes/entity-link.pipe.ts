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
    if (value instanceof Crag) {
      return `/topo/${value.slug}`;
    }
    if (value instanceof Sector) {
      return `/topo/${value.crag.slug}/${value.slug}`;
    }
    if (value instanceof Area) {
      return `/topo/${value.sector.crag.slug}/${value.sector.slug}/${value.slug}`;
    }
    if (value instanceof Line) {
      return `/topo/${value.area.sector.crag.slug}/${value.area.sector.slug}/${value.area.slug}/${value.slug}`;
    }
    return '/';
  }
}
