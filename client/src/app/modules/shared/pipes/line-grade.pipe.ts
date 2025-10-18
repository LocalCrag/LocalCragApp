import { OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';
import { Line } from '../../../models/line';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { Subscription } from 'rxjs';
import { Store } from '@ngrx/store';
import { map, switchMap } from 'rxjs/operators';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';

@Pipe({
  name: 'lineGrade',
  pure: false,
})
export class LineGradePipe implements PipeTransform, OnDestroy {
  private translateSpecialGradesService = inject(TranslateSpecialGradesService);
  private scalesService = inject(ScalesService);
  private store = inject(Store);

  private subscription: Subscription | null = null;
  private cachedResult: string | null = null;
  private lastLine: Line | undefined;

  transform(line?: Line): string {
    if (line !== this.lastLine) {
      this.lastLine = line;
      this.cachedResult = null;

      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      if (line) {
        const observable = this.store.select(selectInstanceSettingsState).pipe(
          map((instanceSettings) =>
            this.scalesService.gradeNameByValue(
              line?.type,
              line?.gradeScale,
              instanceSettings.displayUserGrades
                ? line?.userGradeValue
                : line?.authorGradeValue,
            ),
          ),
          switchMap((gradeNameObservable) => gradeNameObservable),
        );

        this.subscription = observable.subscribe((gradeName) => {
          this.cachedResult =
            this.translateSpecialGradesService.translate(gradeName);
        });
      }
    }

    return this.cachedResult || '';
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
