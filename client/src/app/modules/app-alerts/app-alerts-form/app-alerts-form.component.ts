import {
  Component,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError } from 'rxjs/operators';
import { EMPTY, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AppAlert } from '../../../models/app-alert';
import { AppAlertsService } from '../../../services/crud/app-alerts.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { PageTitleService } from '../../../services/core/page-title.service';
import { AppAlertSeverity } from '../../../enums/app-alert-severity';
import { httpUrlValidator } from '../../../utility/validators/http-url.validator';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmDatePickerImports } from '@spartan-ng/helm/date-picker';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmTextarea } from '@spartan-ng/helm/textarea';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { lucideBan, lucideSave, lucideTrash2 } from '@ng-icons/lucide';

interface SelectItem<T = any> {
  label?: string;
  value?: T;
  [key: string]: any;
}

@Component({
  selector: 'lc-app-alerts-form',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    HlmButton,
    ...HlmSelectImports,
    ...HlmDatePickerImports,
    HlmInput,
    HlmTextarea,
    HlmSpinner,
    NgIcon,
  ],
  templateUrl: './app-alerts-form.component.html',
  styleUrl: './app-alerts-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [provideIcons({ lucideBan, lucideSave, lucideTrash2 })],
})
export class AppAlertsFormComponent implements OnInit {
  private confirmDialog = inject(ConfirmDialogService);
  @ViewChild(FormDirective) formDirective: FormDirective;

  public appAlertForm: FormGroup;
  public loadingState = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public appAlert: AppAlert;
  public editMode = false;
  public severityOptions: SelectItem[];

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private appAlertsService = inject(AppAlertsService);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    this.severityOptions = [
      {
        label: this.translocoService.translate(
          marker('appAlerts.appAlertForm.severity.info'),
        ),
        value: AppAlertSeverity.INFO,
      },
      {
        label: this.translocoService.translate(
          marker('appAlerts.appAlertForm.severity.warning'),
        ),
        value: AppAlertSeverity.WARNING,
      },
      {
        label: this.translocoService.translate(
          marker('appAlerts.appAlertForm.severity.danger'),
        ),
        value: AppAlertSeverity.DANGER,
      },
    ];
    this.buildForm();
    const alertId = this.route.snapshot.paramMap.get('alert-id');
    if (alertId) {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('editAppAlertFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.editMode = true;
      this.setPageTitle();
      this.appAlertForm.disable();
      this.appAlertsService
        .getAlert(alertId)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
              return EMPTY;
            }
            return throwError(() => e);
          }),
        )
        .subscribe((appAlert) => {
          this.appAlert = appAlert;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        });
    } else {
      this.setPageTitle();
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('appAlertFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      this.appAlertForm.patchValue({
        severity: AppAlertSeverity.INFO,
        startsDate: toDateOnly(now),
        startsTime: formatTime(now),
        endsDate: toDateOnly(nextWeek),
        endsTime: formatTime(now),
      });
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? marker('appAlerts.appAlertForm.editAppAlertTitle')
          : marker('appAlerts.appAlertForm.createAppAlertTitle'),
      ),
    );
  }

  private buildForm() {
    this.appAlertForm = this.fb.group({
      message: [null, [Validators.required, Validators.maxLength(500)]],
      severity: [AppAlertSeverity.INFO, [Validators.required]],
      readMoreUrl: [null, [Validators.maxLength(500), httpUrlValidator()]],
      startsDate: [null, [Validators.required]],
      startsTime: ['', [Validators.required, timeValidator]],
      endsDate: [null, [Validators.required]],
      endsTime: ['', [Validators.required, timeValidator]],
    });
  }

  private setFormValue() {
    this.appAlertForm.enable();
    this.appAlertForm.patchValue({
      message: this.appAlert.message,
      severity: this.appAlert.severity,
      readMoreUrl: this.appAlert.readMoreUrl,
      startsDate: toDateOnly(this.appAlert.startsAt),
      startsTime: formatTime(this.appAlert.startsAt),
      endsDate: toDateOnly(this.appAlert.endsAt),
      endsTime: formatTime(this.appAlert.endsAt),
    });
  }

  cancel() {
    this.router.navigate(['/app-alerts']);
  }

  public saveAppAlert() {
    if (this.appAlertForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const appAlert = new AppAlert();
      appAlert.message = this.appAlertForm.get('message').value;
      appAlert.severity = this.appAlertForm.get('severity').value;
      appAlert.readMoreUrl =
        this.appAlertForm.get('readMoreUrl').value?.trim() || null;
      appAlert.startsAt = combineDateAndTime(
        this.appAlertForm.get('startsDate').value,
        this.appAlertForm.get('startsTime').value,
      );
      appAlert.endsAt = combineDateAndTime(
        this.appAlertForm.get('endsDate').value,
        this.appAlertForm.get('endsTime').value,
      );
      if (this.appAlert) {
        appAlert.id = this.appAlert.id;
        this.appAlertsService.updateAlert(appAlert).subscribe(() => {
          this.store.dispatch(toastNotification('APP_ALERT_UPDATED'));
          this.router.navigate(['/app-alerts']);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.appAlertsService.createAlert(appAlert).subscribe(() => {
          this.store.dispatch(toastNotification('APP_ALERT_CREATED'));
          this.router.navigate(['/app-alerts']);
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  confirmDeleteAppAlert(_event: Event) {
    this.confirmDialog.open({
      message: this.translocoService.translate(
        marker('appAlerts.askReallyWantToDeleteAppAlert'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('appAlerts.yesDelete'),
      ),
      rejectLabel: this.translocoService.translate(
        marker('appAlerts.noDontDelete'),
      ),
      destructive: true,
      accept: () => {
        this.deleteAppAlert();
      },
    });
  }

  readonly severityLabel = (value: string | null): string =>
    value
      ? this.translocoService.translate(
          `appAlerts.appAlertForm.severity.${value}`,
        )
      : '';

  readonly formatDay = (date: Date): string =>
    `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;

  readonly parseDay = (value: string): Date | null => parseDayValue(value);

  readonly dateOnly = (date: Date): Date => toDateOnly(date);

  public deleteAppAlert() {
    this.appAlertsService.deleteAlert(this.appAlert).subscribe(() => {
      this.store.dispatch(toastNotification('APP_ALERT_DELETED'));
      this.router.navigate(['/app-alerts']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }
}

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

function timeValidator(control: AbstractControl): ValidationErrors | null {
  const value = `${control.value ?? ''}`.trim();
  if (!value) {
    return null;
  }
  return TIME_PATTERN.test(value) ? null : { invalidTime: true };
}

function formatTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDayValue(value: string): Date | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

function combineDateAndTime(date: Date, time: string): Date {
  const match = TIME_PATTERN.exec(time.trim());
  const hours = Number(match?.[1] ?? 0);
  const minutes = Number(match?.[2] ?? 0);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0,
  );
}
