import { Component, Input, ViewEncapsulation } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NgClass, NgIf } from '@angular/common';
import { Line } from '../../../models/line';
import { AscentFormComponent } from '../ascent-form/ascent-form.component';
import { AscentFormTitleComponent } from '../ascent-form-title/ascent-form-title.component';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { TranslocoDirective } from '@jsverse/transloco';
import { ProjectClimbedFormComponent } from '../project-climbed-form/project-climbed-form.component';
import { ProjectClimbedFormTitleComponent } from '../project-climbed-form-title/project-climbed-form-title.component';

@Component({
  selector: 'lc-tick-button',
  imports: [ButtonModule, NgIf, NgClass, TranslocoDirective],
  templateUrl: './tick-button.component.html',
  styleUrl: './tick-button.component.scss',
  providers: [DialogService],
  encapsulation: ViewEncapsulation.None,
})
export class TickButtonComponent {
  @Input() line: Line;
  @Input() ticked: boolean;
  @Input() showLabel: boolean;

  public ref: DynamicDialogRef | undefined;

  constructor(private dialogService: DialogService) {}

  addAscent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (this.line.gradeValue >= 0) {
      this.ref = this.dialogService.open(AscentFormComponent, {
        modal: true,
        focusOnShow: false,
        templates: {
          header: AscentFormTitleComponent,
        },
        data: {
          line: this.line,
        },
      });
    } else {
      this.ref = this.dialogService.open(ProjectClimbedFormComponent, {
        modal: true,
        focusOnShow: false,
        templates: {
          header: ProjectClimbedFormTitleComponent,
        },
        data: {
          line: this.line,
        },
      });
    }
  }
}
