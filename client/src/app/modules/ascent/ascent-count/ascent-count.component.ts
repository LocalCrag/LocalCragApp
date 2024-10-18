import {Component, Input} from '@angular/core';
import {TranslocoDirective} from '@jsverse/transloco';
import {NgIf} from '@angular/common';

@Component({
  selector: 'lc-ascent-count',
  standalone: true,
  imports: [TranslocoDirective, NgIf],
  templateUrl: './ascent-count.component.html',
  styleUrl: './ascent-count.component.scss',
})
export class AscentCountComponent {
  @Input() ascentCount = 0;
}
