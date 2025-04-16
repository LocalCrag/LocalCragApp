import { Pipe, PipeTransform } from '@angular/core';
import { Ascent } from '../../../models/ascent';

@Pipe({
  name: 'upgrade',
})
export class UpgradePipe implements PipeTransform {
  transform(ascent: Ascent): boolean {
    return ascent.gradeValue > ascent.line.gradeValue;
  }
}
