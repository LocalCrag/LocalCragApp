import { Pipe, PipeTransform } from '@angular/core';
import { TranslateSpecialGradesService } from '../../../services/core/translate-special-grades.service';

@Pipe({
  name: 'translateSpecialGrades',
  standalone: true,
})
export class TranslateSpecialGradesPipe implements PipeTransform {
  constructor(
    private translateSpecialGradesService: TranslateSpecialGradesService,
  ) {}

  public transform(value: string): string {
    return this.translateSpecialGradesService.translate(value);
  }
}
