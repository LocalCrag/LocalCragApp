import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { CragsService } from '../../../services/crud/crags.service';
import { Crag } from '../../../models/crag';
import { AscentListComponent } from '../../ascent/ascent-list/ascent-list.component';
import { SkeletonModule } from 'primeng/skeleton';

@Component({
  selector: 'lc-crag-ascents',
  imports: [AscentListComponent, SkeletonModule],
  templateUrl: './crag-ascents.component.html',
  styleUrl: './crag-ascents.component.scss',
})
export class CragAscentsComponent implements OnInit {
  public crag: Crag;

  private cragsService = inject(CragsService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const cragSlug =
          this.route.parent.parent.snapshot.paramMap.get('crag-slug');
        this.cragsService
          .getCrag(cragSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          )
          .subscribe((crag) => {
            this.crag = crag;
            this.store
              .select(selectInstanceName)
              .pipe(take(1))
              .subscribe((instanceName) => {
                this.title.setTitle(
                  `${crag.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
                );
              });
          });
      });
  }
}
