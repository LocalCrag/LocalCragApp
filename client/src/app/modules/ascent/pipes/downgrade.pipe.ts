import { Pipe, PipeTransform } from '@angular/core';
import { Ascent } from '../../../models/ascent';

@Pipe({
  name: 'downgrade',
})
export class DowngradePipe implements PipeTransform {
  transform(ascent: Ascent): boolean {
    return ascent.gradeValue < ascent.line.gradeValue;
  }
}
