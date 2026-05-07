import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AscentListComponent } from '../../ascent/ascent-list/ascent-list.component';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { catchError, take } from 'rxjs/operators';
import { of } from 'rxjs';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Sector } from '../../../models/sector';
import { SectorsService } from '../../../services/crud/sectors.service';

@Component({
  selector: 'lc-sector-ascents',
  imports: [AscentListComponent, SkeletonModule],
  templateUrl: './sector-ascents.component.html',
  styleUrl: './sector-ascents.component.scss',
})
export class SectorAscentsComponent implements OnInit {
  public sector: Sector;

  private sectorsService = inject(SectorsService);
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
        const sectorSlug =
          this.route.parent.parent.snapshot.paramMap.get('sector-slug');
        this.sectorsService
          .getSector(sectorSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          )
          .subscribe((sector) => {
            this.sector = sector;
            this.store
              .select(selectInstanceName)
              .pipe(take(1))
              .subscribe((instanceName) => {
                this.title.setTitle(
                  `${sector.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
                );
              });
          });
      });
  }
}
