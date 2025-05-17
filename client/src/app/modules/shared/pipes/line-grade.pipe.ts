import { Pipe, PipeTransform } from '@angular/core';
import { Line } from '../../../models/line';
import { AsyncPipe } from '@angular/common';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesPipe } from './translate-special-grades.pipe';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { Store } from '@ngrx/store';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'lineGrade',
  pure: false,
  standalone: false,
})
export class LineGradePipe implements PipeTransform {
  constructor(
    private scalesService: ScalesService,
    private asyncPipe: AsyncPipe,
    private translate: TranslateSpecialGradesPipe,
    private store: Store,
  ) {}

  transform(line?: Line): string {
    const observable = this.store.select(selectInstanceSettingsState).pipe(
      map((instanceSettings) => {
        return this.scalesService.gradeNameByValue(
          line?.type,
          line?.gradeScale,
          instanceSettings.displayUserGradesRatings
            ? line?.userGradeValue
            : line?.authorGradeValue,
        );
      }),
    );
    return this.translate.transform(
      this.asyncPipe.transform(this.asyncPipe.transform(observable)),
    );
  }
}
