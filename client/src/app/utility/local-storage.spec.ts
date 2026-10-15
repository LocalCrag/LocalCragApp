import {
  isLocalStorageAccessDenied,
  isLocalStorageAccessDeniedEvent,
  isLocalStorageAccessError,
  probeLocalStorageAccess,
  readLocalStorageItem,
  writeLocalStorageItem,
} from './local-storage';

describe('local-storage', () => {
  const deniedMessage =
    "Failed to read the 'localStorage' property from 'Window': Access is denied for this document.";

  describe('probeLocalStorageAccess', () => {
    it('accepts a storage object that can be read', () => {
      const storage = {
        getItem: () => null,
      } as unknown as Storage;
      expect(probeLocalStorageAccess(() => storage)).toBeFalse();
    });

    it('treats a missing storage object as denied', () => {
      expect(probeLocalStorageAccess(() => null)).toBeTrue();
    });

    it('treats a throwing getter as denied', () => {
      expect(
        probeLocalStorageAccess(() => {
          throw new DOMException(deniedMessage, 'SecurityError');
        }),
      ).toBeTrue();
    });

    it('treats a throwing read as denied', () => {
      const storage = {
        getItem: () => {
          throw new DOMException('The operation is insecure.', 'SecurityError');
        },
      } as unknown as Storage;
      expect(probeLocalStorageAccess(() => storage)).toBeTrue();
    });
  });

  describe('isLocalStorageAccessDenied', () => {
    it('is false when the document allows localStorage', () => {
      const key = 'lc-storage-probe-test';
      expect(isLocalStorageAccessDenied()).toBeFalse();
      writeLocalStorageItem(key, 'ok');
      expect(readLocalStorageItem(key)).toBe('ok');
      localStorage.removeItem(key);
    });
  });

  describe('isLocalStorageAccessError', () => {
    it('matches the SecurityError reported by Sentry', () => {
      const error = new DOMException(deniedMessage, 'SecurityError');
      expect(isLocalStorageAccessError(error)).toBeTrue();
      expect(isLocalStorageAccessError(deniedMessage)).toBeTrue();
    });

    it('ignores unrelated security errors', () => {
      const error = new DOMException(
        'Failed to execute drawImage on CanvasRenderingContext2D',
        'SecurityError',
      );
      expect(isLocalStorageAccessError(error)).toBeFalse();
    });
  });

  describe('isLocalStorageAccessDeniedEvent', () => {
    it('drops Sentry events for the denied localStorage read', () => {
      expect(
        isLocalStorageAccessDeniedEvent({
          exception: {
            values: [{ type: 'SecurityError', value: deniedMessage }],
          },
        }),
      ).toBeTrue();
    });

    it('keeps unrelated exceptions', () => {
      expect(
        isLocalStorageAccessDeniedEvent({
          exception: {
            values: [
              {
                type: 'TypeError',
                value: 'Cannot read properties of null',
              },
            ],
          },
        }),
      ).toBeFalse();
    });
  });
});
