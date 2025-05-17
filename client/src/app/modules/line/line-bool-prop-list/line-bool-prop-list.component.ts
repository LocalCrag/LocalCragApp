import { Component, Input } from '@angular/core';
import { Line } from '../../../models/line';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { NgIf } from '@angular/common';

/**
 * Component that lists boolean properties of lines in text form.
 */
@Component({
  selector: 'lc-line-bool-prop-list',
  templateUrl: './line-bool-prop-list.component.html',
  styleUrls: ['./line-bool-prop-list.component.scss'],
  imports: [TranslocoDirective, TranslocoPipe, NgIf],
})
export class LineBoolPropListComponent {
  @Input() line: Line;
}
