import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';

@Pipe({
  name: 'translateSpecialGrades',
  standalone: true,
})
export class TranslateSpecialGradesPipe implements PipeTransform {
  private translateSpecialGradesService = inject(TranslateSpecialGradesService);

  /**
   * @param value Grade name to translate.
   * @param unifyProjects When false, keep distinct OPEN/CLOSED project labels
   *   even if noClosedProjects is enabled (used by the scale editor).
   */
  public transform(value: string, unifyProjects = true): string {
    return this.translateSpecialGradesService.translate(value, unifyProjects);
  }
}
