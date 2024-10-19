import {Component} from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef,} from 'primeng/dynamicdialog';
import {TranslocoPipe} from '@jsverse/transloco';
import {Line} from '../../../models/line';

@Component({
  selector: 'lc-ascent-form-title',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './ascent-form-title.component.html',
  styleUrl: './ascent-form-title.component.scss',
})
export class AscentFormTitleComponent {
  public line: Line;

  constructor(
    private dialogConfig: DynamicDialogConfig,
    public ref: DynamicDialogRef,
  ) {
    this.line = this.dialogConfig.data.line
      ? this.dialogConfig.data.line
      : this.dialogConfig.data.ascent.line;
  }
}
