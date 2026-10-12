import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { MessageService } from 'primeng/api';
import { AppNotificationsService } from './app-notifications.service';

describe('AppNotificationsService', () => {
  let service: AppNotificationsService;
  let messages: MessageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppNotificationsService,
        MessageService,
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string) => key,
          },
        },
      ],
    });
    service = TestBed.inject(AppNotificationsService);
    messages = TestBed.inject(MessageService);
    spyOn(messages, 'add');
  });

  it('shows success toasts on every viewport', () => {
    service.toast('ACCOUNT_SETTINGS_UPDATED');

    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'success',
        life: 5000,
      }),
    );
  });

  it('shows info toasts on every viewport', () => {
    service.toast('LOGOUT_SUCCESS');

    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'info',
        life: 5000,
      }),
    );
  });

  it('shows error toasts', () => {
    service.toast('LOGIN_ERROR');

    expect(messages.add).toHaveBeenCalledWith(
      jasmine.objectContaining({
        severity: 'error',
        life: 5000,
      }),
    );
  });
});
