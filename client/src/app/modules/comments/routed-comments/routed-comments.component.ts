import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs/operators';
import { LCObject, ObjectType } from '../../../models/object';
import { ObjectUtilsService } from '../../../services/utils/object-utils.service';
import { CommentsComponent } from '../comments/comments.component';

/**
 * Resolves the comments target from route data/params and renders lc-comments.
 */
@Component({
  selector: 'lc-routed-comments',
  imports: [CommentsComponent],
  template: `
    @if (object) {
      <lc-comments [object]="object"></lc-comments>
    }
  `,
})
export class RoutedCommentsComponent implements OnInit {
  public object: LCObject | null = null;

  private destroyRef = inject(DestroyRef);
  private route = inject(ActivatedRoute);
  private objectUtilsService = inject(ObjectUtilsService);

  ngOnInit(): void {
    this.route.data
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        switchMap((data) => {
          const objectType = data['objectType'] as ObjectType;
          const paramSource =
            objectType === ObjectType.Post
              ? this.route
              : this.route.parent!.parent!;
          return paramSource.paramMap.pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap((params) => {
              let objectSlug = '';
              switch (objectType) {
                case ObjectType.Crag:
                  objectSlug = params.get('crag-slug') ?? '';
                  break;
                case ObjectType.Sector:
                  objectSlug = params.get('sector-slug') ?? '';
                  break;
                case ObjectType.Area:
                  objectSlug = params.get('area-slug') ?? '';
                  break;
                case ObjectType.Line:
                  objectSlug = params.get('line-slug') ?? '';
                  break;
                case ObjectType.Region:
                  // Region has no slug in the route.
                  objectSlug = '';
                  break;
                case ObjectType.User:
                  objectSlug = params.get('user-slug') ?? '';
                  break;
                case ObjectType.Post:
                  objectSlug = params.get('post-slug') ?? '';
                  break;
              }
              return this.objectUtilsService.getObject(objectType, objectSlug);
            }),
          );
        }),
      )
      .subscribe((obj) => {
        this.object = obj;
      });
  }
}
