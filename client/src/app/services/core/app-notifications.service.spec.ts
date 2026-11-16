import { TestBed } from '@angular/core/testing';
import { TranslocoService } from '@jsverse/transloco';
import { toast } from '@spartan-ng/brain/sonner';
import { AppNotificationsService } from './app-notifications.service';

vi.mock('@spartan-ng/brain/sonner', () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('AppNotificationsService', () => {
  let service: AppNotificationsService;

  beforeEach(() => {
    vi.mocked(toast.success).mockClear();
    vi.mocked(toast.info).mockClear();
    vi.mocked(toast.error).mockClear();
    TestBed.configureTestingModule({
      providers: [
        AppNotificationsService,
        {
          provide: TranslocoService,
          useValue: {
            translate: (key: string) => key,
          },
        },
      ],
    });
    service = TestBed.inject(AppNotificationsService);
  });

  it('shows success toasts on every viewport', () => {
    service.toast('ACCOUNT_SETTINGS_UPDATED');

    expect(toast.success).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        duration: 5000,
      }),
    );
  });

  it('shows info toasts on every viewport', () => {
    service.toast('LOGOUT_SUCCESS');

    expect(toast.info).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        duration: 5000,
      }),
    );
  });

  it('shows error toasts', () => {
    service.toast('LOGIN_ERROR');

    expect(toast.error).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        duration: 5000,
      }),
    );
  });
});
