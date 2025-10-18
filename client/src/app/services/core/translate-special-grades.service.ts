import { Injectable, inject } from '@angular/core';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({
  providedIn: 'root',
})
export class TranslateSpecialGradesService {
  private translocoService = inject(TranslocoService);

  public translate(value: string): string {
    const specialGrades: string[] = [
      marker('CLOSED_PROJECT'),
      marker('OPEN_PROJECT'),
      marker('UNGRADED'),
    ];
    if (specialGrades.includes(value)) {
      return this.translocoService.translate(value);
    }
    return value;
  }
}
