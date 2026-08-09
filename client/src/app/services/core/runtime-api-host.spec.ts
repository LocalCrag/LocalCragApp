import {
  API_HOST_PREFERENCE_KEY,
  isAllowedApiHostUrl,
  normalizeApiHostUrl,
  resolveApiHost,
} from './runtime-api-host';

describe('resolveApiHost', () => {
  it('returns defaultHost on web without touching Preferences', async () => {
    const getPreference = jasmine.createSpy('getPreference');
    const setPreference = jasmine.createSpy('setPreference');

    await expectAsync(
      resolveApiHost({
        isNativePlatform: () => false,
        defaultHost: 'http://127.0.0.1:5000',
        getPreference,
        setPreference,
      }),
    ).toBeResolvedTo('http://127.0.0.1:5000');
    expect(getPreference).not.toHaveBeenCalled();
    expect(setPreference).not.toHaveBeenCalled();
  });

  it('returns stored Preferences value on native when set', async () => {
    const getPreference = jasmine
      .createSpy('getPreference')
      .and.resolveTo({ value: 'https://example.localcrag.test' });
    const setPreference = jasmine.createSpy('setPreference');

    await expectAsync(
      resolveApiHost({
        isNativePlatform: () => true,
        defaultHost: 'http://10.0.2.2:5000',
        getPreference,
        setPreference,
      }),
    ).toBeResolvedTo('https://example.localcrag.test');
    expect(getPreference).toHaveBeenCalledWith({
      key: API_HOST_PREFERENCE_KEY,
    });
    expect(setPreference).not.toHaveBeenCalled();
  });

  it('seeds Preferences from defaultHost on native when unset', async () => {
    const getPreference = jasmine
      .createSpy('getPreference')
      .and.resolveTo({ value: null });
    const setPreference = jasmine
      .createSpy('setPreference')
      .and.resolveTo(undefined);

    await expectAsync(
      resolveApiHost({
        isNativePlatform: () => true,
        defaultHost: 'http://10.0.2.2:5000',
        getPreference,
        setPreference,
      }),
    ).toBeResolvedTo('http://10.0.2.2:5000');
    expect(setPreference).toHaveBeenCalledWith({
      key: API_HOST_PREFERENCE_KEY,
      value: 'http://10.0.2.2:5000',
    });
  });
});

describe('API_HOST_PREFERENCE_KEY', () => {
  it('is the literal apiHost key Phase 16 must reuse (D-03)', () => {
    expect(API_HOST_PREFERENCE_KEY).toBe('apiHost');
  });
});

describe('normalizeApiHostUrl', () => {
  it('trims whitespace and strips trailing slashes', () => {
    expect(normalizeApiHostUrl('  https://example.com/  ')).toBe(
      'https://example.com',
    );
  });
});

describe('isAllowedApiHostUrl', () => {
  it('allows https hosts', () => {
    expect(isAllowedApiHostUrl('https://example.com')).toBeTrue();
  });

  it('allows emulator loopback http://10.0.2.2', () => {
    expect(isAllowedApiHostUrl('http://10.0.2.2:5000')).toBeTrue();
  });

  it('allows private LAN http hosts for physical-device debug', () => {
    expect(isAllowedApiHostUrl('http://192.168.178.20:5000')).toBeTrue();
    expect(isAllowedApiHostUrl('http://10.0.0.5:5000')).toBeTrue();
    expect(isAllowedApiHostUrl('http://172.16.1.2:5000')).toBeTrue();
    expect(isAllowedApiHostUrl('http://127.0.0.1:5000')).toBeTrue();
  });

  it('rejects public cleartext http hosts', () => {
    expect(isAllowedApiHostUrl('http://evil.example')).toBeFalse();
    expect(isAllowedApiHostUrl('http://8.8.8.8:5000')).toBeFalse();
  });

  it('rejects empty or invalid URLs', () => {
    expect(isAllowedApiHostUrl('')).toBeFalse();
    expect(isAllowedApiHostUrl('not-a-url')).toBeFalse();
  });
});
