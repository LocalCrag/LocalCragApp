import {
  Component,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmAlert, HlmAlertDescription } from '@spartan-ng/helm/alert';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Line } from '../../../models/line';
import { Ascent } from '../../../models/ascent';
import { Store } from '@ngrx/store';
import { AscentsService } from '../../../services/crud/ascents.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { ProjectClimbedFormTitleComponent } from '../project-climbed-form-title/project-climbed-form-title.component';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';

@Component({
  selector: 'lc-project-climbed-form',
  imports: [
    LoadingButtonComponent,
    ReactiveFormsModule,
    HlmAlert,
    HlmAlertDescription,
    TranslocoDirective,
    TranslocoPipe,
    HlmTextarea,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    ProjectClimbedFormTitleComponent,
  ],
  templateUrl: './project-climbed-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './project-climbed-form.component.scss',
})
export class ProjectClimbedFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public projectClimbedForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public line: Line;

  private fb = inject(FormBuilder);
  private dialogContext = injectBrnDialogContext<{
    line?: Line;
    ascent?: Ascent;
  }>();
  private store = inject(Store);
  private ref = inject(BrnDialogRef);
  private ascentsService = inject(AscentsService);

  constructor() {
    this.line = this.dialogContext.line
      ? this.dialogContext.line
      : this.dialogContext.ascent.line;
  }

  ngOnInit() {
    this.buildForm();
  }

  private buildForm() {
    this.projectClimbedForm = this.fb.group({
      message: [null, [Validators.required]],
    });
  }

  public sendMessage() {
    if (this.projectClimbedForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const message = this.projectClimbedForm.get('message').value;
      this.ascentsService
        .sendProjectClimbedMessage(message, this.line.id)
        .subscribe(() => {
          this.store.dispatch(
            toastNotification('PROJECT_CLIMBED_MESSAGE_SENT'),
          );
          this.loadingState = LoadingState.DEFAULT;
          this.ref.close();
        });
    } else {
      this.formDirective.markAsTouched();
    }
  }
}
