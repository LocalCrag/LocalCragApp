import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { InputTextModule } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';

@Component({
  selector: 'lc-delete-own-user-dialog',
  templateUrl: './delete-own-user-dialog.component.html',
  standalone: true,
  imports: [
    TranslocoDirective,
    ReactiveFormsModule,
    InputTextModule,
    Button,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
  ],
})
export class DeleteOwnUserDialogComponent implements OnInit {
  public form: FormGroup;
  public email: string;

  constructor(
    private fb: FormBuilder,
    private dialogConfig: DynamicDialogConfig,
    private ref: DynamicDialogRef,
  ) {}

  ngOnInit(): void {
    this.email = this.dialogConfig.data?.email ?? '';
    this.form = this.fb.group({
      email: ['', [Validators.required]],
    });
  }

  get emailMatches(): boolean {
    return (this.form.get('email')?.value ?? '') === this.email;
  }

  cancel() {
    this.ref.close(false);
  }

  confirm() {
    if (this.form.valid && this.emailMatches) {
      this.ref.close(true);
    }
  }
}
