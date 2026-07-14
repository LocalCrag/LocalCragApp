import { Component, DestroyRef, inject, ViewChild } from '@angular/core';
import {
  BlocWeatherConfig,
  BlocWeatherReportStatus,
  BlocWeatherService,
} from '../../../services/crud/blocweather.service';
import { ThemeService } from '../../../services/core/theme.service';
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
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { AppNotificationsService } from '../../../services/core/app-notifications.service';
import { Message } from 'primeng/message';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
    TranslocoPipe,
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

  public get dryDt() {
    return this.buildToggleDt('green');
  }
  public get someWetDt() {
    return this.buildToggleDt('yellow');
  }
  public get mostlyWetDt() {
    return this.buildToggleDt('orange');
  }
  public get wetDt() {
    return this.buildToggleDt('red');
  }

  private config: BlocWeatherConfig;
  private blocWeatherService = inject(BlocWeatherService);
  private notifications = inject(AppNotificationsService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private theme = inject(ThemeService);

  /**
   * Toggle-button design tokens per status color. In dark mode the unchecked
   * state uses deep palette steps so the buttons don't glow against the dark
   * dialog; the checked (selected) state stays vivid in both themes.
   */
  private buildToggleDt(hue: string) {
    if (this.theme.isDarkMode()) {
      return {
        background: `{${hue}.950}`,
        borderColor: `{${hue}.800}`,
        color: `{${hue}.300}`,
        hoverBackground: `{${hue}.900}`,
        hoverBorderColor: `{${hue}.700}`,
        hoverColor: `{${hue}.200}`,
        checkedBackground: `{${hue}.500}`,
        checkedBorderColor: `{${hue}.500}`,
        checkedColor: '{surface.0}',
        checkedHoverBackground: `{${hue}.400}`,
        checkedHoverBorderColor: `{${hue}.400}`,
        checkedHoverColor: '{surface.0}',
        contentBackground: `{${hue}.950}`,
        contentCheckedBackground: `{${hue}.500}`,
      };
    }
    return {
      background: `{${hue}.50}`,
      borderColor: `{${hue}.100}`,
      color: `{${hue}.700}`,
      hoverBackground: `{${hue}.100}`,
      hoverBorderColor: `{${hue}.200}`,
      hoverColor: `{${hue}.800}`,
      checkedBackground: `{${hue}.500}`,
      checkedBorderColor: `{${hue}.500}`,
      checkedColor: '{surface.0}',
      checkedHoverBackground: `{${hue}.600}`,
      checkedHoverBorderColor: `{${hue}.600}`,
      checkedHoverColor: '{surface.0}',
      contentBackground: `{${hue}.50}`,
      contentCheckedBackground: `{${hue}.500}`,
    };
  }

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
    this.blocWeatherService
      .reportConditions(this.config, status, this.form.get('observedAt').value)
      .subscribe({
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
