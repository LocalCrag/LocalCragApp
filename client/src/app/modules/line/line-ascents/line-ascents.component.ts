import { Component, OnInit } from '@angular/core';
import { AscentListComponent } from '../../ascent/ascent-list/ascent-list.component';
import { NgForOf, NgIf } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { catchError } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Line } from '../../../models/line';
import { LinesService } from '../../../services/crud/lines.service';
import { AscentListSkeletonComponent } from '../../ascent/ascent-list-skeleton/ascent-list-skeleton.component';
import { ScalesService } from '../../../services/crud/scales.service';

@Component({
  selector: 'lc-line-ascents',
  imports: [
    AscentListComponent,
    NgForOf,
    NgIf,
    SkeletonModule,
    AscentListSkeletonComponent,
  ],
  templateUrl: './line-ascents.component.html',
  styleUrl: './line-ascents.component.scss',
})
export class LineAscentsComponent implements OnInit {
  public line: Line;

  constructor(
    private linesService: LinesService,
    private translocoService: TranslocoService,
    private router: Router,
    private store: Store,
    private title: Title,
    private route: ActivatedRoute,
    private scalesService: ScalesService,
  ) {}

  ngOnInit() {
    const lineSlug =
      this.route.snapshot.parent.parent.paramMap.get('line-slug');
    this.linesService
      .getLine(lineSlug)
      .pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        }),
      )
      .subscribe((line) => {
        this.line = line;
        forkJoin([
          this.store.select(selectInstanceName),
          this.scalesService.gradeNameByValue(
            line.type,
            line.gradeScale,
            line.gradeValue,
          ),
        ]).subscribe(([instanceName, gradeName]) => {
          this.title.setTitle(
            `${line.name} ${line.gradeValue > 0 ? gradeName : this.translocoService.translate(gradeName)} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
          );
        });
      });
  }
}
