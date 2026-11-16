import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  OnInit,
  Output,
  ViewChild,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import {
  TRANSLOCO_SCOPE,
  TranslocoDirective,
  TranslocoService,
} from '@jsverse/transloco';
import { HlmAlert } from '@spartan-ng/helm/alert';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSelectImports } from '@spartan-ng/helm/select';
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
import { LanguageService } from '../../../../services/core/language.service';

@Component({
  selector: 'lc-scheduled-closure-config-dialog',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    NgIcon,
    HlmAlert,
    HlmButton,
    HlmInput,
    ...HlmDialogImports,
    ...HlmSelectImports,
    ...HlmDatePickerImports,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
  ],
  templateUrl: './scheduled-closure-config-dialog.component.html',
  styleUrl: './scheduled-closure-config-dialog.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [
    { provide: TRANSLOCO_SCOPE, useValue: 'closableForm' },
    provideIcons({ lucideInfo }),
  ],
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
  /** Exposed for template comparisons. */
  protected readonly ClosureScheduleType = ClosureScheduleType;
  /** Stable reference — do not recreate on every change detection (PrimeNG re-renders otherwise). */
  annualScheduleReferenceDate = new Date(annualScheduleReferenceYear(), 0, 1);

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private languageService = inject(LanguageService);
  private transloco = inject(TranslocoService);

  readonly formatPickerDate = (date: Date): string => {
    const language = this.languageService.calculatedLanguage;
    if (this.scheduleType === ClosureScheduleType.ANNUAL) {
      return new Intl.DateTimeFormat(language, {
        day: '2-digit',
        month: '2-digit',
      }).format(date);
    }
    return new Intl.DateTimeFormat(language, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  readonly scheduleTypeLabel = (type: ClosureScheduleType): string =>
    this.transloco.translate(
      `closableForm.closableForm.${this.scheduleTypeLabelKey(type)}`,
    );

  ngOnInit(): void {
    this.scheduleForm = buildClosureScheduleDialogForm(this.fb);
    this.scheduleForm
      .get('scheduleType')
      ?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((scheduleType) => {
        if (scheduleType === ClosureScheduleType.PERMANENT) {
          this.scheduleForm.patchValue({ startDate: null, endDate: null });
          this.startDate = null;
          this.endDate = null;
        } else if (scheduleType === ClosureScheduleType.FIXED) {
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
    return (
      this.scheduleForm.get('scheduleType')?.value ?? ClosureScheduleType.ANNUAL
    );
  }

  scheduleTypeLabelKey(type: ClosureScheduleType): string {
    switch (type) {
      case ClosureScheduleType.PERMANENT:
        return 'permanentScheduleTitle';
      case ClosureScheduleType.FIXED:
        return 'fixedScheduleTitle';
      default:
        return 'annualScheduleTitle';
    }
  }

  open(schedule?: ClosureSchedule): void {
    if (!schedule) {
      schedule = new ClosureSchedule();
      schedule.scheduleType = ClosureScheduleType.ANNUAL;
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
      this.scheduleType === ClosureScheduleType.FIXED &&
      !!endDate?.touched &&
      !!endDate?.hasError('fixedEndBeforeStart')
    );
  }

  get showAnnualEndDateError(): boolean {
    const endDate = this.scheduleForm.get('endDate');
    const startDate = this.scheduleForm.get('startDate');
    const errorKey = this.annualEndDateErrorKey;
    if (!errorKey || this.scheduleType !== ClosureScheduleType.ANNUAL) {
      return false;
    }
    if (errorKey === 'annualDatesRequiredValidationError') {
      return !!endDate?.touched && !!startDate?.touched;
    }
    return !!endDate?.touched || !!startDate?.touched;
  }

  /** t(closableForm.closableForm.annualDatesRequiredValidationError, closableForm.closableForm.annualCoversEntireYearValidationError) */
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
      this.scheduleType === ClosureScheduleType.ANNUAL
        ? normalizeAnnualPickerDate(value)
        : value;
    this.startDate = date;
    this.scheduleForm.get('startDate')?.setValue(date);
    this.scheduleForm.get('startDate')?.markAsTouched();
  }

  onEndDateChange(value: Date | null): void {
    const date =
      this.scheduleType === ClosureScheduleType.ANNUAL
        ? normalizeAnnualPickerDate(value)
        : value;
    this.endDate = date;
    this.scheduleForm.get('endDate')?.setValue(date);
    this.scheduleForm.get('endDate')?.markAsTouched();
  }

  save(): void {
    if (this.scheduleType === ClosureScheduleType.ANNUAL) {
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
