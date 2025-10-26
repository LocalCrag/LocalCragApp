import { Component, Input } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'lc-ascent-count',
  imports: [TranslocoDirective],
  templateUrl: './ascent-count.component.html',
  styleUrl: './ascent-count.component.scss',
})
export class AscentCountComponent {
  @Input() ascentCount = 0;
}
