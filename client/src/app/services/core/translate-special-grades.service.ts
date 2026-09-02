import { Injectable, inject } from '@angular/core';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { TranslocoService } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { selectNoClosedProjects } from '../../ngrx/selectors/instance-settings.selectors';

@Injectable({
  providedIn: 'root',
})
export class TranslateSpecialGradesService {
  private translocoService = inject(TranslocoService);
  private store = inject(Store);
  private noClosedProjects = false;

  constructor() {
    this.store.select(selectNoClosedProjects).subscribe((noClosedProjects) => {
      this.noClosedProjects = noClosedProjects;
    });
  }

  /**
   * Translates special grade names. When noClosedProjects is enabled and
   * unifyProjects is true (default), OPEN_PROJECT and CLOSED_PROJECT both
   * become the unified PROJECT label.
   */
  public translate(value: string, unifyProjects = true): string {
    const specialGrades: string[] = [
      marker('CLOSED_PROJECT'),
      marker('OPEN_PROJECT'),
      marker('UNGRADED'),
      marker('PROJECT'),
    ];
    if (
      unifyProjects &&
      this.noClosedProjects &&
      (value === 'CLOSED_PROJECT' || value === 'OPEN_PROJECT')
    ) {
      return this.translocoService.translate(marker('PROJECT'));
    }
    if (specialGrades.includes(value)) {
      return this.translocoService.translate(value);
    }
    return value;
  }
}
