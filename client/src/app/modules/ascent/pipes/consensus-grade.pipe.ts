import { Pipe, PipeTransform } from '@angular/core';
import { Ascent } from '../../../models/ascent';

@Pipe({
  name: 'consensusGrade',
  standalone: true,
})
export class ConsensusGradePipe implements PipeTransform {
  transform(ascent: Ascent): boolean {
    return ascent.gradeValue === ascent.line.gradeValue;
  }
}
