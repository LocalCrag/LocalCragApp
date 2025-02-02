import { Pipe, PipeTransform } from '@angular/core';
import { Line } from '../../../models/line';
import { AsyncPipe } from '@angular/common';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesPipe } from './translate-special-grades.pipe';

@Pipe({
  name: 'lineGrade',
  pure: false,
})
export class LineGradePipe implements PipeTransform {
  constructor(private scalesService: ScalesService,
              private asyncPipe: AsyncPipe,
              private translate: TranslateSpecialGradesPipe)
  {}

  transform(line?: Line): string {
    const observable = this.scalesService.gradeNameByValue(line?.type, line?.gradeScale, line?.gradeValue);
    return this.translate.transform(this.asyncPipe.transform(observable));
  }
}
