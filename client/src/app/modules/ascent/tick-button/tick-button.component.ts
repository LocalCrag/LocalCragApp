import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { NgClass } from '@angular/common';
import { Line } from '../../../models/line';
import { AscentFormComponent } from '../ascent-form/ascent-form.component';
import { AscentFormTitleComponent } from '../ascent-form-title/ascent-form-title.component';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslocoDirective } from '@jsverse/transloco';
import { ProjectClimbedFormComponent } from '../project-climbed-form/project-climbed-form.component';
import { ProjectClimbedFormTitleComponent } from '../project-climbed-form-title/project-climbed-form-title.component';
import { Store } from '@ngrx/store';
import { selectInstanceSettingsState } from '../../../ngrx/selectors/instance-settings.selectors';
import { take } from 'rxjs/operators';

@Component({
  selector: 'lc-tick-button',
  imports: [ButtonModule, NgClass, TranslocoDirective],
  templateUrl: './tick-button.component.html',
  styleUrl: './tick-button.component.scss',
  providers: [DialogService],
  encapsulation: ViewEncapsulation.None,
})
export class TickButtonComponent {
  @Input() line: Line;
  @Input() ticked: boolean;
  @Input() showLabel: boolean;

  private dialogService = inject(DialogService);
  private store = inject(Store);

  addAscent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    openTickDialog(this.dialogService, this.store, this.line);
  }
}

/** Opens the ascent dialog, or the project-climbed dialog when the line has no grade. */
export function openTickDialog(
  dialogService: DialogService,
  store: Store,
  line: Line,
): void {
  store
    .select(selectInstanceSettingsState)
    .pipe(take(1))
    .subscribe((instanceSettings) => {
      const gradeValue = instanceSettings.displayUserGrades
        ? line.userGradeValue
        : line.authorGradeValue;
      if (gradeValue >= 0) {
        dialogService.open(AscentFormComponent, {
          modal: true,
          focusOnShow: false,
          templates: {
            header: AscentFormTitleComponent,
          },
          data: {
            line,
          },
        });
        return;
      }
      dialogService.open(ProjectClimbedFormComponent, {
        modal: true,
        focusOnShow: false,
        templates: {
          header: ProjectClimbedFormTitleComponent,
        },
        data: {
          line,
        },
      });
    });
}
