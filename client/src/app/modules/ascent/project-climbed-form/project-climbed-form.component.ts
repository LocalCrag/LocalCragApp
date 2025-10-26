import { Component, OnInit, ViewChild, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Line } from '../../../models/line';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Store } from '@ngrx/store';
import { AscentsService } from '../../../services/crud/ascents.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { TranslocoDirective } from '@jsverse/transloco';
import { Textarea } from 'primeng/textarea';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

@Component({
  selector: 'lc-project-climbed-form',
  imports: [
    ReactiveFormsModule,
    DividerModule,
    ButtonModule,
    MessageModule,
    TranslocoDirective,
    Textarea,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './project-climbed-form.component.html',
  styleUrl: './project-climbed-form.component.scss',
})
export class ProjectClimbedFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public projectClimbedForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public line: Line;

  private fb = inject(FormBuilder);
  private dialogConfig = inject(DynamicDialogConfig);
  private store = inject(Store);
  private ref = inject(DynamicDialogRef);
  private ascentsService = inject(AscentsService);

  constructor() {
    this.line = this.dialogConfig.data.line
      ? this.dialogConfig.data.line
      : this.dialogConfig.data.ascent.line;
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
