import { Component, inject } from '@angular/core';
import { injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { Line } from '../../../models/line';
import { Ascent } from '../../../models/ascent';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineGradePipe } from '../../shared/pipes/line-grade.pipe';

type AscentFormTitleContext = {
  line?: Line;
  ascent?: Ascent;
};

@Component({
  selector: 'lc-ascent-form-title',
  templateUrl: './ascent-form-title.component.html',
  styleUrl: './ascent-form-title.component.scss',
  imports: [LineGradePipe],
})
export class AscentFormTitleComponent {
  public line: Line;

  private dialogContext = injectBrnDialogContext<AscentFormTitleContext>();

  protected scalesService = inject(ScalesService);

  constructor() {
    this.line = this.dialogContext.line
      ? this.dialogContext.line
      : this.dialogContext.ascent.line;
  }
}
