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
import { ConfirmationService } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError } from 'rxjs/operators';
import { EMPTY, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { AdminMessage } from '../../../models/admin-message';
import { AdminMessagesService } from '../../../services/crud/admin-messages.service';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { PageTitleService } from '../../../services/core/page-title.service';

@Component({
  selector: 'lc-admin-messages-form',
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
  ],
  templateUrl: './admin-messages-form.component.html',
  styleUrl: './admin-messages-form.component.scss',
  providers: [ConfirmationService],
})
export class AdminMessagesFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public adminMessageForm: FormGroup;
  public loadingState = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public adminMessage: AdminMessage;
  public editMode = false;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private adminMessagesService = inject(AdminMessagesService);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private confirmationService = inject(ConfirmationService);
  private pageTitleService = inject(PageTitleService);

  ngOnInit() {
    this.buildForm();
    const messageId = this.route.snapshot.paramMap.get('message-id');
    if (messageId) {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('editAdminMessageFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.editMode = true;
      this.setPageTitle();
      this.adminMessageForm.disable();
      this.adminMessagesService
        .getMessage(messageId)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
              return EMPTY;
            }
            return throwError(() => e);
          }),
        )
        .subscribe((adminMessage) => {
          this.adminMessage = adminMessage;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        });
    } else {
      this.setPageTitle();
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('adminMessageFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? marker('adminMessages.form.editAdminMessageTitle')
          : marker('adminMessages.form.createAdminMessageTitle'),
      ),
    );
  }

  private buildForm() {
    this.adminMessageForm = this.fb.group({
      title: [null, [Validators.required, Validators.maxLength(200)]],
      text: [null, [Validators.required, Validators.maxLength(10000)]],
    });
  }

  private setFormValue() {
    this.adminMessageForm.enable();
    this.adminMessageForm.patchValue({
      title: this.adminMessage.title,
      text: this.adminMessage.text,
    });
  }

  cancel() {
    this.router.navigate(['/admin-messages']);
  }

  public saveAdminMessage() {
    if (this.adminMessageForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const adminMessage = new AdminMessage();
      adminMessage.title = this.adminMessageForm.get('title').value;
      adminMessage.text = this.adminMessageForm.get('text').value;
      if (this.adminMessage) {
        adminMessage.id = this.adminMessage.id;
        this.adminMessagesService.updateMessage(adminMessage).subscribe(() => {
          this.store.dispatch(toastNotification('ADMIN_MESSAGE_UPDATED'));
          this.router.navigate(['/admin-messages']);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.adminMessagesService.createMessage(adminMessage).subscribe(() => {
          this.store.dispatch(toastNotification('ADMIN_MESSAGE_CREATED'));
          this.router.navigate(['/admin-messages']);
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  confirmDeleteAdminMessage(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('adminMessages.askReallyWantToDeleteAdminMessage'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('adminMessages.yesDelete'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('adminMessages.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteAdminMessage();
      },
    });
  }

  public deleteAdminMessage() {
    this.adminMessagesService.deleteMessage(this.adminMessage).subscribe(() => {
      this.store.dispatch(toastNotification('ADMIN_MESSAGE_DELETED'));
      this.router.navigate(['/admin-messages']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }
}
