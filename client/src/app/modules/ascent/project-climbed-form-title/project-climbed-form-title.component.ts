import { Component } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Line } from '../../../models/line';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';

@Component({
  selector: 'lc-project-climbed-form-title',
  templateUrl: './project-climbed-form-title.component.html',
  styleUrl: './project-climbed-form-title.component.scss',
  imports: [LineGradePipe],
})
export class ProjectClimbedFormTitleComponent {
  public line: Line;

  constructor(
    private dialogConfig: DynamicDialogConfig,
    public ref: DynamicDialogRef,
    protected scalesService: ScalesService,
  ) {
    this.line = this.dialogConfig.data.line
      ? this.dialogConfig.data.line
      : this.dialogConfig.data.ascent.line;
  }
}
