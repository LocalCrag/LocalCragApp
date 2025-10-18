import { Component, OnInit, inject } from '@angular/core';
import { AscentListComponent } from '../../ascent/ascent-list/ascent-list.component';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { AreasService } from '../../../services/crud/areas.service';
import { Area } from '../../../models/area';

@Component({
  selector: 'lc-area-ascents',
  imports: [AscentListComponent, SkeletonModule],
  templateUrl: './area-ascents.component.html',
  styleUrl: './area-ascents.component.scss',
})
export class AreaAscentsComponent implements OnInit {
  public area: Area;

  private areasService = inject(AreasService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    const areaSlug =
      this.route.snapshot.parent.parent.paramMap.get('area-slug');
    this.areasService
      .getArea(areaSlug)
      .pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        }),
      )
      .subscribe((area) => {
        this.area = area;
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${area.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
          );
        });
      });
  }
}
