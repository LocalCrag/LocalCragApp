import { inject, Injectable } from '@angular/core';
import { EMPTY, Observable } from 'rxjs';
import { CragsService } from '../crud/crags.service';
import { SectorsService } from '../crud/sectors.service';
import { AreasService } from '../crud/areas.service';
import { LinesService } from '../crud/lines.service';
import { UsersService } from '../crud/users.service';
import { ObjectType } from '../../models/object';
import { PostsService } from '../crud/posts.service';
import { RegionService } from '../crud/region.service';

@Injectable({
  providedIn: 'root',
})
export class ObjectUtilsService {
  private cragsService = inject(CragsService);
  private sectorsService = inject(SectorsService);
  private areasService = inject(AreasService);
  private linesService = inject(LinesService);
  private usersService = inject(UsersService);
  private postsService = inject(PostsService);
  private regionsService = inject(RegionService);

  public getObject(
    objectType: ObjectType,
    objectSlug: string,
  ): Observable<any> {
    switch (objectType) {
      case ObjectType.Crag:
        return this.cragsService.getCrag(objectSlug);
      case ObjectType.Sector:
        return this.sectorsService.getSector(objectSlug);
      case ObjectType.Area:
        return this.areasService.getArea(objectSlug);
      case ObjectType.Line:
        return this.linesService.getLine(objectSlug);
      case ObjectType.Region:
        return this.regionsService.getRegion();
      case ObjectType.User:
        return this.usersService.getUser(objectSlug);
      case ObjectType.Post:
        return this.postsService.getPost(objectSlug);
      default:
        return EMPTY;
    }
  }
}
