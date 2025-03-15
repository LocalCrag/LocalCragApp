import { Pipe, PipeTransform } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';

@Pipe({
  name: 'translateSpecialGrades',
  standalone: false,
})
export class TranslateSpecialGradesPipe
  extends TranslocoPipe
  implements PipeTransform
{
  override transform(value: string): string {
    const specialGrades: string[] = [
      marker('CLOSED_PROJECT'),
      marker('OPEN_PROJECT'),
      marker('UNGRADED'),
    ];
    if (specialGrades.includes(value)) {
      return super.transform(value);
    }
    return value;
  }
}
