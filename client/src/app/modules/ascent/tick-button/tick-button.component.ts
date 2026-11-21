import {
  Component,
  Input,
  ViewEncapsulation,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCheck } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogService } from '@spartan-ng/helm/dialog';
import { Line } from '../../../models/line';
import { AscentFormComponent } from '../ascent-form/ascent-form.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ProjectClimbedFormComponent } from '../project-climbed-form/project-climbed-form.component';
import { AccountPromptDialogComponent } from '../../core/account-prompt-dialog/account-prompt-dialog.component';
import { Store } from '@ngrx/store';
import { selectIsLoggedIn } from '../../../ngrx/selectors/auth.selectors';
import {
  selectInstanceSettingsState,
  selectSoftGating,
} from '../../../ngrx/selectors/instance-settings.selectors';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
function openVisitorAccountPrompt(dialogService: HlmDialogService): void {
  dialogService.open(AccountPromptDialogComponent, {
    contentClass: 'sm:max-w-md',
  });
}

@Component({
  selector: 'lc-tick-button',
  imports: [HlmButton, NgClass, NgIcon, TranslocoDirective],
  templateUrl: './tick-button.component.html',
  styleUrl: './tick-button.component.scss',
  providers: [provideIcons({ lucideCheck })],
  changeDetection: ChangeDetectionStrategy.Eager,
  encapsulation: ViewEncapsulation.None,
})
export class TickButtonComponent {
  @Input() line: Line;
  @Input() ticked: boolean;
  @Input() showLabel: boolean;

  public visible = false;

  private loggedIn = false;
  private dialogService = inject(HlmDialogService);
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
      openVisitorAccountPrompt(this.dialogService);
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
  dialogService: HlmDialogService,
  store: Store,
  _translocoService: TranslocoService,
  line: Line,
): void {
  combineLatest([
    store.select(selectIsLoggedIn),
    store.select(selectInstanceSettingsState),
  ])
    .pipe(take(1))
    .subscribe(([loggedIn, instanceSettings]) => {
      if (!loggedIn) {
        openVisitorAccountPrompt(dialogService);
        return;
      }
      const gradeValue = instanceSettings.displayUserGrades
        ? line.userGradeValue
        : line.authorGradeValue;
      if (gradeValue >= 0) {
        dialogService.open(AscentFormComponent, {
          context: { line },
          contentClass: 'sm:max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto',
        });
        return;
      }
      dialogService.open(ProjectClimbedFormComponent, {
        context: { line },
        contentClass: 'sm:max-w-xl max-h-[calc(100dvh-2rem)] overflow-y-auto',
      });
    });
}
