import { Component, OnInit } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { catchError } from 'rxjs/operators';
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

  constructor(
    private cragsService: CragsService,
    private translocoService: TranslocoService,
    private router: Router,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    const cragSlug =
      this.route.snapshot.parent.parent.paramMap.get('crag-slug');
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
        this.store.select(selectInstanceName).subscribe((instanceName) => {
          this.title.setTitle(
            `${crag.name} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
          );
        });
      });
  }
}
