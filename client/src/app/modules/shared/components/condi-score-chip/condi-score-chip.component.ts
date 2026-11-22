import { NgClass } from '@angular/common';
import { Component, input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslocoDirective } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import {
  condiScoreBand,
  formatCondiScore,
} from '../../../../utility/condi-score';

@Component({
  selector: 'lc-condi-score-chip',
  templateUrl: './condi-score-chip.component.html',
  styleUrl: './condi-score-chip.component.scss',
  imports: [NgClass, TranslocoDirective],
})
export class CondiScoreChipComponent {
  public readonly score = input.required<number>();
  public readonly link = input.required<string[]>();

  private router = inject(Router);

  protected formatted(): string {
    return formatCondiScore(this.score());
  }

  protected band(): string {
    return condiScoreBand(this.score());
  }

  protected bandKey(): string {
    switch (this.band()) {
      case 'terrible':
        return marker('condicaster.band.terrible');
      case 'poor':
        return marker('condicaster.band.poor');
      case 'mixed':
        return marker('condicaster.band.mixed');
      case 'good':
        return marker('condicaster.band.good');
      case 'veryGood':
        return marker('condicaster.band.veryGood');
      case 'excellent':
        return marker('condicaster.band.excellent');
      default:
        return marker('condicaster.band.perfect');
    }
  }

  protected open(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(this.link());
  }
}
