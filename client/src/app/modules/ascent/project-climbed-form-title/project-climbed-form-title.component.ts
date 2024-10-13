import { Component } from '@angular/core';
import {DynamicDialogConfig, DynamicDialogRef} from 'primeng/dynamicdialog';
import {TranslocoPipe} from '@jsverse/transloco';
import {Line} from '../../../models/line';

@Component({
  selector: 'lc-project-climbed-form-title',
  standalone: true,
  imports: [
    TranslocoPipe
  ],
  templateUrl: './project-climbed-form-title.component.html',
  styleUrl: './project-climbed-form-title.component.scss'
})
export class ProjectClimbedFormTitleComponent {

  public line: Line;

  constructor(private dialogConfig: DynamicDialogConfig,
              public ref: DynamicDialogRef) {
    this.line = this.dialogConfig.data.line ? this.dialogConfig.data.line : this.dialogConfig.data.ascent.line;
  }

}
