import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
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
import { Message } from 'primeng/message';
import { Select } from 'primeng/select';
import {
  ClosureSchedule,
  ClosureScheduleType,
} from '../../../../models/closure-schedule';
import { FormDirective } from '../../forms/form.directive';
import { ControlGroupDirective } from '../../forms/control-group.directive';
import { FormControlDirective } from '../../forms/form-control.directive';
import {
  annualScheduleReferenceYear,
  applyCurrentYearToMonthDay,
  buildClosureScheduleDialogForm,
  CLOSURE_SCHEDULE_TYPES,
  normalizeAnnualPickerDate,
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
    Message,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
  ],
  templateUrl: './scheduled-closure-config-dialog.component.html',
  styleUrl: './scheduled-closure-config-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
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
  /** Stable reference — do not recreate on every change detection (PrimeNG re-renders otherwise). */
  annualScheduleReferenceDate = new Date(annualScheduleReferenceYear(), 0, 1);

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  ngOnInit(): void {
    this.scheduleForm = buildClosureScheduleDialogForm(this.fb);
    this.scheduleForm
      .get('scheduleType')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scheduleType) => {
        if (scheduleType === 'PERMANENT') {
          this.scheduleForm.patchValue({ startDate: null, endDate: null });
          this.startDate = null;
          this.endDate = null;
        } else if (scheduleType === 'FIXED') {
          const start = this.scheduleForm.get('startDate')
            ?.value as Date | null;
          const end = this.scheduleForm.get('endDate')?.value as Date | null;
          const startDate = applyCurrentYearToMonthDay(start);
          const endDate = applyCurrentYearToMonthDay(end);
          this.scheduleForm.patchValue({ startDate, endDate });
          this.startDate = startDate;
          this.endDate = endDate;
        }
        this.scheduleForm.get('endDate')?.updateValueAndValidity({
          emitEvent: false,
        });
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
    this.annualScheduleReferenceDate = new Date(
      annualScheduleReferenceYear(),
      0,
      1,
    );
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

  get showAnnualEndDateError(): boolean {
    const endDate = this.scheduleForm.get('endDate');
    const startDate = this.scheduleForm.get('startDate');
    const errorKey = this.annualEndDateErrorKey;
    if (!errorKey || this.scheduleType !== 'ANNUAL') {
      return false;
    }
    if (errorKey === 'annualDatesRequiredValidationError') {
      return !!endDate?.touched && !!startDate?.touched;
    }
    return !!endDate?.touched || !!startDate?.touched;
  }

  get annualEndDateErrorKey(): string | null {
    const endDate = this.scheduleForm.get('endDate');
    if (!endDate) {
      return null;
    }
    if (endDate.hasError('annualDatesRequired')) {
      return 'annualDatesRequiredValidationError';
    }
    if (endDate.hasError('annualCoversEntireYear')) {
      return 'annualCoversEntireYearValidationError';
    }
    return null;
  }

  onStartDateChange(value: Date | null): void {
    const date =
      this.scheduleType === 'ANNUAL' ? normalizeAnnualPickerDate(value) : value;
    this.startDate = date;
    this.scheduleForm.get('startDate')?.setValue(date);
    this.scheduleForm.get('startDate')?.markAsTouched();
  }

  onEndDateChange(value: Date | null): void {
    const date =
      this.scheduleType === 'ANNUAL' ? normalizeAnnualPickerDate(value) : value;
    this.endDate = date;
    this.scheduleForm.get('endDate')?.setValue(date);
    this.scheduleForm.get('endDate')?.markAsTouched();
  }

  save(): void {
    if (this.scheduleType === 'ANNUAL') {
      this.scheduleForm.get('startDate')?.markAsTouched();
      this.scheduleForm.get('endDate')?.markAsTouched();
      this.scheduleForm.get('endDate')?.updateValueAndValidity();
    }
    if (this.scheduleForm.valid) {
      readClosureScheduleFromDialogForm(this.scheduleForm, this.schedule);
      if (!this.schedule.id) {
        this.newSchedule.emit(this.schedule);
      }
      this.isOpen = false;
    } else {
      this.scheduleForm.get('endDate')?.markAsTouched();
      this.formDirective.markAsTouched();
    }
  }
}
