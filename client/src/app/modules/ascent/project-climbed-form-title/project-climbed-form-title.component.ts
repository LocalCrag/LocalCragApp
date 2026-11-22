import { Component, inject } from '@angular/core';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { Line } from '../../../models/line';
import { Ascent } from '../../../models/ascent';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';

type ProjectClimbedTitleContext = {
  line?: Line;
  ascent?: Ascent;
};

@Component({
  selector: 'lc-project-climbed-form-title',
  templateUrl: './project-climbed-form-title.component.html',
  styleUrl: './project-climbed-form-title.component.scss',
  imports: [LineGradePipe],
})
export class ProjectClimbedFormTitleComponent {
  public line: Line;

  private dialogContext = injectBrnDialogContext<ProjectClimbedTitleContext>();
  protected scalesService = inject(ScalesService);

  constructor() {
    this.line = this.dialogContext.line
      ? this.dialogContext.line
      : this.dialogContext.ascent.line;
  }
}
