import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import {
  BlocWeatherConfig,
  BlocWeatherReportStatus,
  BlocWeatherService,
} from '../../../services/crud/blocweather.service';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { DatePicker } from 'primeng/datepicker';
import { Textarea } from 'primeng/textarea';
import { TranslocoDirective } from '@jsverse/transloco';
import { AppNotificationsService } from '../../../services/core/app-notifications.service';
import { Message } from 'primeng/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { FormDirective } from '../../shared/forms/form.directive';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

const STATUS_OPTIONS: BlocWeatherReportStatus[] = [
  'dry',
  'some_wet',
  'mostly_wet',
  'wet',
];

const atLeastOneStatusValidator: ValidatorFn = (group: AbstractControl) => {
  const fg = group as FormGroup;
  return STATUS_OPTIONS.some((s) => fg.get(s)?.value === true)
    ? null
    : { noStatusSelected: true };
};

@Component({
  selector: 'lc-report-conditions-dialog',
  imports: [
    ReactiveFormsModule,
    DialogModule,
    ButtonModule,
    ToggleButtonModule,
    DatePicker,
    Textarea,
    TranslocoDirective,
    Message,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './report-conditions-dialog.component.html',
  styleUrl: './report-conditions-dialog.component.scss',
})
export class ReportConditionsDialogComponent {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public isOpen = false;
  public loading = false;
  public submitted = false;
  public form: FormGroup;
  public maxDate = new Date(Date.now() + 60_000);

  public dryDt = {
    background: '{green.50}',
    borderColor: '{green.100}',
    color: '{green.700}',
    hoverBackground: '{green.100}',
    hoverBorderColor: '{green.200}',
    hoverColor: '{green.800}',
    checkedBackground: '{green.500}',
    checkedBorderColor: '{green.500}',
    checkedColor: '{surface.0}',
    checkedHoverBackground: '{green.600}',
    checkedHoverBorderColor: '{green.600}',
    checkedHoverColor: '{surface.0}',
    contentBackground: '{green.50}',
    contentCheckedBackground: '{green.500}',
  };
  public someWetDt = {
    background: '{yellow.50}',
    borderColor: '{yellow.100}',
    color: '{yellow.700}',
    hoverBackground: '{yellow.100}',
    hoverBorderColor: '{yellow.200}',
    hoverColor: '{yellow.800}',
    checkedBackground: '{yellow.500}',
    checkedBorderColor: '{yellow.500}',
    checkedColor: '{surface.0}',
    checkedHoverBackground: '{yellow.600}',
    checkedHoverBorderColor: '{yellow.600}',
    checkedHoverColor: '{surface.0}',
    contentBackground: '{yellow.50}',
    contentCheckedBackground: '{yellow.500}',
  };
  public mostlyWetDt = {
    background: '{orange.50}',
    borderColor: '{orange.100}',
    color: '{orange.700}',
    hoverBackground: '{orange.100}',
    hoverBorderColor: '{orange.200}',
    hoverColor: '{orange.800}',
    checkedBackground: '{orange.500}',
    checkedBorderColor: '{orange.500}',
    checkedColor: '{surface.0}',
    checkedHoverBackground: '{orange.600}',
    checkedHoverBorderColor: '{orange.600}',
    checkedHoverColor: '{surface.0}',
    contentBackground: '{orange.50}',
    contentCheckedBackground: '{orange.500}',
  };
  public wetDt = {
    background: '{red.50}',
    borderColor: '{red.100}',
    color: '{red.700}',
    hoverBackground: '{red.100}',
    hoverBorderColor: '{red.200}',
    hoverColor: '{red.800}',
    checkedBackground: '{red.500}',
    checkedBorderColor: '{red.500}',
    checkedColor: '{surface.0}',
    checkedHoverBackground: '{red.600}',
    checkedHoverBorderColor: '{red.600}',
    checkedHoverColor: '{surface.0}',
    contentBackground: '{red.50}',
    contentCheckedBackground: '{red.500}',
  };

  private config: BlocWeatherConfig;
  private blocWeatherService = inject(BlocWeatherService);
  private notifications = inject(AppNotificationsService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  public open(config: BlocWeatherConfig) {
    this.config = config;
    this.submitted = false;
    this.form = this.fb.group(
      {
        dry: [false],
        some_wet: [false],
        mostly_wet: [false],
        wet: [false],
        observedAt: [null, Validators.required],
        comment: [null],
      },
      { validators: atLeastOneStatusValidator },
    );
    this.setupMutualExclusivity();
    this.isOpen = true;
  }

  private setupMutualExclusivity() {
    STATUS_OPTIONS.forEach((status) => {
      this.form
        .get(status)
        .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((checked: boolean) => {
          if (checked) {
            STATUS_OPTIONS.filter((s) => s !== status).forEach((other) => {
              this.form.get(other).setValue(false, { emitEvent: false });
            });
          }
        });
    });
  }

  public setNow() {
    const now = new Date();
    this.maxDate = new Date(now.getTime() + 60_000);
    this.form.get('observedAt').setValue(now);
  }

  public close() {
    this.isOpen = false;
  }

  public submit() {
    this.submitted = true;
    if (this.form.invalid) {
      this.formDirective.markAsTouched();
      return;
    }
    const status = STATUS_OPTIONS.find(
      (s) => this.form.get(s).value === true,
    ) as BlocWeatherReportStatus;
    this.loading = true;
    // TODO: remove no-op and uncomment real call
    // this.blocWeatherService
    //   .reportConditions(this.config, status, this.form.get('observedAt').value)
    of(status).subscribe({
      next: () => {
        this.notifications.toast('BLOCWEATHER_REPORT_SUCCESS');
        this.loading = false;
        this.close();
      },
      error: () => {
        this.notifications.toast('BLOCWEATHER_REPORT_ERROR');
        this.loading = false;
      },
    });
  }
}
