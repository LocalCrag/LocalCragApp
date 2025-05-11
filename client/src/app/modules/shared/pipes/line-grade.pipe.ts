import { OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Line } from '../../../models/line';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';
import { Subscription } from 'rxjs';

@Pipe({
  name: 'lineGrade',
  pure: false,
})
export class LineGradePipe implements PipeTransform, OnDestroy {
  private subscription: Subscription | null = null;
  private cachedResult: string | null = null;
  private lastLine: Line | undefined;

  constructor(
    private translateSpecialGradesService: TranslateSpecialGradesService,
    private scalesService: ScalesService,
  ) {}

  transform(line?: Line): string {
    if (line !== this.lastLine) {
      this.lastLine = line;
      this.cachedResult = null;

      if (this.subscription) {
        this.subscription.unsubscribe();
      }

      if (line) {
        const observable = this.scalesService.gradeNameByValue(
          line.type,
          line.gradeScale,
          line.gradeValue,
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
