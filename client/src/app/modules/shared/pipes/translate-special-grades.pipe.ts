import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';

@Pipe({
  name: 'translateSpecialGrades',
  standalone: true,
})
export class TranslateSpecialGradesPipe implements PipeTransform {
  private translateSpecialGradesService = inject(TranslateSpecialGradesService);

  public transform(value: string): string {
    return this.translateSpecialGradesService.translate(value);
  }
}
