import { OnDestroy, Pipe, PipeTransform, inject } from '@angular/core';
import { Ascent } from '../../../models/ascent';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

// Normally the pipe should have pure: false, but as there are few live instance settings changes, we omit it to increase the performance
@Pipe({
  name: 'downgrade',
})
export class DowngradePipe implements PipeTransform, OnDestroy {
  private store = inject(Store);
  private cachedResult: boolean = false;
  private subscription: Subscription | null = null;

  transform(ascent: Ascent): boolean {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = this.store
      .select(selectInstanceSettingsState)
      .pipe(
        map(
          (instanceSettings) =>
            ascent.gradeValue <
            (instanceSettings.displayUserGrades
              ? ascent.line.userGradeValue
              : ascent.line.authorGradeValue),
        ),
      )
      .subscribe((result) => {
        this.cachedResult = result;
      });

    return this.cachedResult;
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
