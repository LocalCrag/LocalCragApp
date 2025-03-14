import { Component, OnInit, ViewChild } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { DividerModule } from 'primeng/divider';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { NgIf } from '@angular/common';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { Line } from '../../../models/line';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { Store } from '@ngrx/store';
import { AscentsService } from '../../../services/crud/ascents.service';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { TranslocoDirective } from '@jsverse/transloco';
import { Textarea } from 'primeng/textarea';

@Component({
  selector: 'lc-project-climbed-form',
  standalone: true,
  imports: [
    SharedModule,
    ReactiveFormsModule,
    DividerModule,
    ButtonModule,
    MessageModule,
    NgIf,
    TranslocoDirective,
    Textarea,
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

  constructor(
    private fb: FormBuilder,
    private dialogConfig: DynamicDialogConfig,
    private store: Store,
    private ref: DynamicDialogRef,
    private ascentsService: AscentsService,
  ) {
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
