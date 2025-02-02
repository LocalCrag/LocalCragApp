import { Component } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { AsyncPipe } from '@angular/common';
import { Line } from '../../../models/line';
import { ScalesService } from '../../../services/crud/scales.service';
import { SharedModule } from '../../shared/shared.module';

@Component({
  selector: 'lc-ascent-form-title',
  standalone: true,
  imports: [AsyncPipe, SharedModule],
  templateUrl: './ascent-form-title.component.html',
  styleUrl: './ascent-form-title.component.scss',
})
export class AscentFormTitleComponent {
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
