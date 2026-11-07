import { Component, Input, ViewEncapsulation, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ButtonModule } from 'primeng/button';
import { NgClass } from '@angular/common';
import { Line } from '../../../models/line';
import { AscentFormComponent } from '../ascent-form/ascent-form.component';
import { AscentFormTitleComponent } from '../ascent-form-title/ascent-form-title.component';
import { DialogService } from 'primeng/dynamicdialog';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ProjectClimbedFormComponent } from '../project-climbed-form/project-climbed-form.component';
import { ProjectClimbedFormTitleComponent } from '../project-climbed-form-title/project-climbed-form-title.component';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import {
  selectInstanceSettingsState,
  selectSoftGating,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import { openAccountPrompt } from '../../core/account-prompt-dialog/account-prompt-dialog.component';

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

  public visible = false;

  private loggedIn = false;
  private dialogService = inject(DialogService);
  private store = inject(Store);
  private translocoService = inject(TranslocoService);

  constructor() {
    combineLatest([
      this.store.select(selectIsLoggedIn),
      this.store.select(selectSoftGating),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([loggedIn, softGating]) => {
        this.loggedIn = loggedIn;
        this.visible = loggedIn || softGating;
      });
  }

  addAscent(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!this.loggedIn) {
      openAccountPrompt(this.dialogService, this.translocoService);
      return;
    }
    openTickDialog(
      this.dialogService,
      this.store,
      this.translocoService,
      this.line,
    );
  }
}

/** Opens the ascent dialog, or the project-climbed dialog when the line has no grade. */
export function openTickDialog(
  dialogService: DialogService,
  store: Store,
  translocoService: TranslocoService,
  line: Line,
): void {
  combineLatest([
    store.select(selectIsLoggedIn),
    store.select(selectInstanceSettingsState),
  ])
    .pipe(take(1))
    .subscribe(([loggedIn, instanceSettings]) => {
      if (!loggedIn) {
        openAccountPrompt(dialogService, translocoService);
        return;
      }
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
