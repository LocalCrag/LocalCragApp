import { Component, Input, ViewEncapsulation } from '@angular/core';
import { highlightColor, textColor } from '../../../../utility/misc/color';

/**
 * Numbered line badge used in topo image lists and line path editors.
 */
@Component({
  selector: 'lc-line-number-badge',
  templateUrl: './line-number-badge.component.html',
  styleUrl: './line-number-badge.component.scss',
  encapsulation: ViewEncapsulation.None,
})
export class LineNumberBadgeComponent {
  @Input({ required: true }) number: number;
  @Input() color?: string;

  protected readonly textColor = textColor;
  protected readonly highlightColor = highlightColor;
}
