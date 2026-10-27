import { Component, Input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';
import { topoQualityTierColor } from '../topo-quality-tier';

@Component({
  selector: 'lc-topo-quality-bar',
  imports: [TranslocoDirective],
  templateUrl: './topo-quality-bar.component.html',
  styleUrl: './topo-quality-bar.component.scss',
})
export class TopoQualityBarComponent {
  @Input() earned = 0;
  @Input() max = 0;
  @Input() bonus = 0;
  @Input() percent = 0;
  @Input() tier = 'weak';

  color(): string {
    return topoQualityTierColor(this.tier);
  }
}
