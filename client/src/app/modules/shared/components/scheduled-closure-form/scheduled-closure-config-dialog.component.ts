import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { Button } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { Dialog } from 'primeng/dialog';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import {
  ClosureSchedule,
  ClosureScheduleType,
} from '../../../../models/closure-schedule';
import { FormDirective } from '../../forms/form.directive';
import { ControlGroupDirective } from '../../forms/control-group.directive';
import { FormControlDirective } from '../../forms/form-control.directive';
import {
  ANNUAL_SCHEDULE_REFERENCE_YEAR,
  buildClosureScheduleDialogForm,
  CLOSURE_SCHEDULE_TYPES,
  patchClosureScheduleDialogForm,
  readClosureScheduleFromDialogForm,
} from '../../utils/scheduled-closure-form';

@Component({
  selector: 'lc-scheduled-closure-config-dialog',
  imports: [
    ReactiveFormsModule,
    FormsModule,
    TranslocoDirective,
    Dialog,
    Button,
    Select,
    DatePickerModule,
    InputText,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
  ],
  templateUrl: './scheduled-closure-config-dialog.component.html',
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'closableForm' }],
})
export class ScheduledClosureConfigDialogComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  @Output() newSchedule = new EventEmitter<ClosureSchedule>();

  scheduleForm: FormGroup;
  isOpen = false;
  schedule: ClosureSchedule;
  startDate: Date | null = null;
  endDate: Date | null = null;
  readonly scheduleTypes = CLOSURE_SCHEDULE_TYPES;
  readonly annualScheduleReferenceDate = new Date(
    ANNUAL_SCHEDULE_REFERENCE_YEAR,
    0,
    1,
  );

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.scheduleForm = buildClosureScheduleDialogForm(this.fb);
    this.scheduleForm
      .get('scheduleType')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.scheduleForm.get('scheduleType')?.value === 'PERMANENT') {
          this.scheduleForm.patchValue({ startDate: null, endDate: null });
          this.startDate = null;
          this.endDate = null;
        }
      });
    this.scheduleForm
      .get('startDate')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.scheduleForm.get('endDate')?.updateValueAndValidity({
          emitEvent: false,
        });
      });
  }

  get scheduleType(): ClosureScheduleType {
    return this.scheduleForm.get('scheduleType')?.value ?? 'ANNUAL';
  }

  scheduleTypeLabelKey(type: ClosureScheduleType): string {
    switch (type) {
      case 'PERMANENT':
        return 'permanentScheduleTitle';
      case 'FIXED':
        return 'fixedScheduleTitle';
      default:
        return 'annualScheduleTitle';
    }
  }

  open(schedule?: ClosureSchedule): void {
    if (!schedule) {
      schedule = new ClosureSchedule();
      schedule.scheduleType = 'ANNUAL';
    }
    this.schedule = schedule;
    patchClosureScheduleDialogForm(this.scheduleForm, schedule);
    this.syncDatesFromForm();
    this.isOpen = true;
  }

  private syncDatesFromForm(): void {
    this.startDate = this.scheduleForm.get('startDate')?.value ?? null;
    this.endDate = this.scheduleForm.get('endDate')?.value ?? null;
  }

  close(): void {
    this.isOpen = false;
  }

  get showFixedEndDateError(): boolean {
    const endDate = this.scheduleForm.get('endDate');
    return (
      this.scheduleType === 'FIXED' &&
      !!endDate?.touched &&
      !!endDate?.hasError('fixedEndBeforeStart')
    );
  }

  onStartDateChange(value: Date | null): void {
    this.startDate = value;
    this.scheduleForm.get('startDate')?.setValue(value);
    this.scheduleForm.get('startDate')?.markAsTouched();
    this.scheduleForm.get('endDate')?.updateValueAndValidity();
  }

  onEndDateChange(value: Date | null): void {
    this.endDate = value;
    this.scheduleForm.get('endDate')?.setValue(value);
    this.scheduleForm.get('endDate')?.markAsTouched();
  }

  save(): void {
    if (this.scheduleForm.valid) {
      readClosureScheduleFromDialogForm(this.scheduleForm, this.schedule);
      if (!this.schedule.id) {
        this.newSchedule.emit(this.schedule);
      }
      this.isOpen = false;
    } else {
      this.formDirective.markAsTouched();
    }
  }
}
