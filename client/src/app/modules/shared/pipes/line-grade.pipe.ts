import { Pipe, PipeTransform } from '@angular/core';
import { Line } from '../../../models/line';
import { AsyncPipe } from '@angular/common';
import { ScalesService } from '../../../services/crud/scales.service';
import { TranslateSpecialGradesPipe } from './translate-special-grades.pipe';

@Pipe({
  name: 'lineGrade',
})
export class LineGradePipe implements PipeTransform {
  constructor(private scalesService: ScalesService,
              private asyncPipe: AsyncPipe,
              private translate: TranslateSpecialGradesPipe)
  {}

  transform(line?: Line): string {
    // todo for some reason this does not work with the same reliability as piping these components individually
    // mainly, it does not work if the scale is not yet cached
    const observable = this.scalesService.gradeNameByValue(line?.type, line?.gradeScale, line?.gradeValue);
    observable.subscribe((value) => {console.log(value)})
    return this.translate.transform(this.asyncPipe.transform(observable));
  }
}
