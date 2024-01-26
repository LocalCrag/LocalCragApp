import {Component, Input} from '@angular/core';
import {Line} from '../../../models/line';

/**
 * Component that lists boolean properties of lines in text form.
 */
@Component({
  selector: 'lc-line-bool-prop-list',
  templateUrl: './line-bool-prop-list.component.html',
  styleUrls: ['./line-bool-prop-list.component.scss']
})
export class LineBoolPropListComponent {

  @Input() line: Line;

}
