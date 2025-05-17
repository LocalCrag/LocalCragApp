import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Ascent } from '../../../models/ascent';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { map } from 'rxjs/operators';
import { Subscription } from 'rxjs';

// Normally the pipe should have pure: false, but as there are few live instance settings changes, we omit it to increase the performance
@Pipe({
  name: 'consensusGrade',
})
export class ConsensusGradePipe implements PipeTransform, OnDestroy {
  private cachedResult: boolean = false;
  private subscription: Subscription | null = null;

  constructor(private store: Store) {}

  transform(ascent: Ascent): boolean {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }

    this.subscription = this.store
      .select(selectInstanceSettingsState)
      .pipe(
        map(
          (instanceSettings) =>
            ascent.gradeValue ===
            (instanceSettings.displayUserGradesRatings
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
