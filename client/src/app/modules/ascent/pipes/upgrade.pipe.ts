import { Pipe, PipeTransform } from '@angular/core';
import {Ascent} from '../../../models/ascent';

@Pipe({
  name: 'upgrade',
  standalone: true
})
export class UpgradePipe implements PipeTransform {

  transform(ascent: Ascent): boolean {
    return ascent.grade.value > ascent.line.grade.value;
  }

}
