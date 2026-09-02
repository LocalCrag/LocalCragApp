import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
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
import { ConfirmationService, SelectItem } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError } from 'rxjs/operators';
import { EMPTY, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AppAlert } from '../../../models/app-alert';
import { AppAlertsService } from '../../../services/crud/app-alerts.service';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { PageTitleService } from '../../../services/core/page-title.service';
import { Select } from 'primeng/select';
import { DatePicker } from 'primeng/datepicker';
import { AppAlertSeverity } from '../../../enums/app-alert-severity';
import { httpUrlValidator } from '../../../utility/validators/http-url.validator';

@Component({
  selector: 'lc-app-alerts-form',
  imports: [
    ButtonModule,
    ConfirmPopupModule,
    InputTextModule,
    TextareaModule,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    Select,
    DatePicker,
  ],
  templateUrl: './app-alerts-form.component.html',
  styleUrl: './app-alerts-form.component.scss',
  providers: [ConfirmationService],
})
export class AppAlertsFormComponent implements OnInit {
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
  private confirmationService = inject(ConfirmationService);
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
        startsAt: now,
        endsAt: nextWeek,
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
      startsAt: [null, [Validators.required]],
      endsAt: [null, [Validators.required]],
    });
  }

  private setFormValue() {
    this.appAlertForm.enable();
    this.appAlertForm.patchValue({
      message: this.appAlert.message,
      severity: this.appAlert.severity,
      readMoreUrl: this.appAlert.readMoreUrl,
      startsAt: this.appAlert.startsAt,
      endsAt: this.appAlert.endsAt,
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
      appAlert.startsAt = this.appAlertForm.get('startsAt').value;
      appAlert.endsAt = this.appAlertForm.get('endsAt').value;
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

  confirmDeleteAppAlert(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('appAlerts.askReallyWantToDeleteAppAlert'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('appAlerts.yesDelete'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('appAlerts.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteAppAlert();
      },
    });
  }

  public deleteAppAlert() {
    this.appAlertsService.deleteAlert(this.appAlert).subscribe(() => {
      this.store.dispatch(toastNotification('APP_ALERT_DELETED'));
      this.router.navigate(['/app-alerts']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }
}
