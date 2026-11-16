import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';

@Component({
  selector: 'lc-delete-own-user-dialog',
  templateUrl: './delete-own-user-dialog.component.html',
  standalone: true,
  imports: [
    HlmInput,
    HlmButton,
    TranslocoDirective,
    ReactiveFormsModule,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
  ],
})
export class DeleteOwnUserDialogComponent implements OnInit {
  public form: FormGroup;
  public email: string;

  private fb = inject(FormBuilder);
  private readonly dialogContext = injectBrnDialogContext<{ email?: string }>();
  private ref = inject(BrnDialogRef<boolean>);

  ngOnInit(): void {
    this.email = this.dialogContext.email ?? '';
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
