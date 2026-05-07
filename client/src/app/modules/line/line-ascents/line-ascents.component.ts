import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AscentListComponent } from '../../ascent/ascent-list/ascent-list.component';
import { SkeletonModule } from 'primeng/skeleton';
import { TranslocoService } from '@jsverse/transloco';
import { ActivatedRoute, Router } from '@angular/router';
import { select, Store } from '@ngrx/store';
import { Title } from '@angular/platform-browser';
import { catchError, take } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs';
import {
  selectInstanceName,
  selectInstanceSettingsState,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Line } from '../../../models/line';
import { LinesService } from '../../../services/crud/lines.service';
import { ScalesService } from '../../../services/crud/scales.service';

@Component({
  selector: 'lc-line-ascents',
  imports: [AscentListComponent, SkeletonModule],
  templateUrl: './line-ascents.component.html',
  styleUrl: './line-ascents.component.scss',
})
export class LineAscentsComponent implements OnInit {
  public line: Line;

  private linesService = inject(LinesService);
  private translocoService = inject(TranslocoService);
  private router = inject(Router);
  private store = inject(Store);
  private title = inject(Title);
  private route = inject(ActivatedRoute);
  private scalesService = inject(ScalesService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    this.route.parent.parent.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const lineSlug =
          this.route.parent.parent.snapshot.paramMap.get('line-slug');
        forkJoin([
          this.linesService.getLine(lineSlug).pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          ),
          this.store.pipe(select(selectInstanceSettingsState), take(1)),
        ]).subscribe(([line, instanceSettings]) => {
          this.line = line;
          const gradeValue = instanceSettings.displayUserGrades
            ? line.userGradeValue
            : line.authorGradeValue;
          forkJoin([
            this.store.select(selectInstanceName).pipe(take(1)),
            this.scalesService.gradeNameByValue(
              line.type,
              line.gradeScale,
              gradeValue,
            ),
          ]).subscribe(([instanceName, gradeName]) => {
            this.title.setTitle(
              `${line.name} ${gradeValue > 0 ? gradeName : this.translocoService.translate(gradeName)} / ${this.translocoService.translate(marker('ascents'))} - ${instanceName}`,
            );
          });
        });
      });
  }
}
