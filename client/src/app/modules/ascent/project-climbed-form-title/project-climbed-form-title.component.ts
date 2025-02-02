import { Component } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AsyncPipe } from '@angular/common';
import { Line } from '../../../models/line';
import { SharedModule } from '../../shared/shared.module';
import { ScalesService } from '../../../services/crud/scales.service';

@Component({
  selector: 'lc-project-climbed-form-title',
  standalone: true,
  imports: [AsyncPipe, SharedModule],
  templateUrl: './project-climbed-form-title.component.html',
  styleUrl: './project-climbed-form-title.component.scss',
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
