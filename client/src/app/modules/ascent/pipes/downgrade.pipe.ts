import { Pipe, PipeTransform } from '@angular/core';
import { Ascent } from '../../../models/ascent';
import { AsyncPipe } from '@angular/common';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { map } from 'rxjs/operators';

// Normally the pipe should have pure: false, but as there are few live instance settings changes, we omit it to increase the performance
@Pipe({
  name: 'downgrade',
  standalone: true,
})
export class DowngradePipe implements PipeTransform {
  constructor(
    private asyncPipe: AsyncPipe,
    private store: Store,
  ) {}
  transform(ascent: Ascent): boolean {
    const observable = this.store
      .select(selectInstanceSettingsState)
      .pipe(
        map(
          (instanceSettings) =>
            ascent.gradeValue <
            (instanceSettings.displayUserGrades
              ? ascent.line.userGradeValue
              : ascent.line.authorGradeValue),
        ),
      );
    return this.asyncPipe.transform(observable);
  }
}
