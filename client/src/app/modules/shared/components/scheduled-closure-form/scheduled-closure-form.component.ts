import {
  ChangeDetectorRef,
  Component,
  forwardRef,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendar,
  lucidePencil,
  lucidePlus,
  lucideTrash,
} from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import {
  ClosureSchedule,
  ClosureScheduleType,
} from '../../../../models/closure-schedule';
import { ScheduledClosureConfigDialogComponent } from './scheduled-closure-config-dialog.component';
import { ControlGroupDirective } from '../../forms/control-group.directive';
import { formatScheduleSummary } from '../../utils/scheduled-closure-form';

@Component({
  selector: 'lc-scheduled-closure-form',
  imports: [
    TranslocoDirective,
    NgIcon,
    HlmButton,
    ScheduledClosureConfigDialogComponent,
    ControlGroupDirective,
  ],
  templateUrl: './scheduled-closure-form.component.html',
  styleUrl: './scheduled-closure-form.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ScheduledClosureFormComponent),
      multi: true,
    },
    { provide: TRANSLOCO_SCOPE, useValue: 'closableForm' },
    provideIcons({ lucideCalendar, lucidePencil, lucidePlus, lucideTrash }),
  ],
  encapsulation: ViewEncapsulation.None,
})
export class ScheduledClosureFormComponent implements ControlValueAccessor {
  schedules: ClosureSchedule[] = [];
  isDisabled = false;

  private cdr = inject(ChangeDetectorRef);

  writeValue(value: ClosureSchedule[] | null): void {
    this.schedules = value ?? [];
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: ClosureSchedule[]) => void): void {
    this.propagateChange = fn;
  }

  registerOnTouched(_fn: () => void): void {}

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  propagateChange = (_: ClosureSchedule[]) => {};

  onChange(): void {
    this.propagateChange(this.schedules);
  }

  addSchedule(schedule: ClosureSchedule): void {
    this.schedules.push(schedule);
    this.onChange();
  }

  removeSchedule(schedule: ClosureSchedule): void {
    this.schedules.splice(this.schedules.indexOf(schedule), 1);
    this.onChange();
  }

  /** t(closableForm.closableForm.permanentScheduleTitle, closableForm.closableForm.fixedScheduleTitle, closableForm.closableForm.annualScheduleTitle) */
  scheduleTitleKey(scheduleType: ClosureScheduleType): string {
    switch (scheduleType) {
      case ClosureScheduleType.PERMANENT:
        return 'permanentScheduleTitle';
      case ClosureScheduleType.FIXED:
        return 'fixedScheduleTitle';
      default:
        return 'annualScheduleTitle';
    }
  }

  scheduleSummary(schedule: ClosureSchedule): string {
    return formatScheduleSummary(schedule);
  }
}
