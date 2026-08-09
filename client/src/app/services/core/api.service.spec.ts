import { TestBed } from '@angular/core/testing';
import { ApiService } from './api.service';
import { RUNTIME_API_HOST } from './runtime-api-host';

describe('ApiService', () => {
  let api: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: RUNTIME_API_HOST, useValue: 'https://runtime.test' },
      ],
    });
    api = TestBed.inject(ApiService);
  });

  it('builds auth URLs from RUNTIME_API_HOST', () => {
    expect(api.auth.login()).toBe('https://runtime.test/api/login');
    expect(api.auth.loginRefresh()).toBe(
      'https://runtime.test/api/token/refresh',
    );
  });

  it('builds upload URL from RUNTIME_API_HOST', () => {
    expect(api.uploader.uploadFile()).toBe('https://runtime.test/api/upload');
  });
});
