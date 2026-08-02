import { parseServerUtcDate } from './parse-server-utc-date';
import { isRulesUnread } from '../services/crud/rules-read-status.util';

describe('parseServerUtcDate', () => {
  it('treats naive ISO datetimes as UTC', () => {
    const parsed = parseServerUtcDate('2026-07-24T12:00:00');
    expect(parsed).not.toBeNull();
    expect(parsed!.toISOString()).toBe('2026-07-24T12:00:00.000Z');
  });

  it('preserves explicit Z / offset strings', () => {
    expect(parseServerUtcDate('2026-07-24T12:00:00Z')!.toISOString()).toBe(
      '2026-07-24T12:00:00.000Z',
    );
    expect(parseServerUtcDate('2026-07-24T14:00:00+02:00')!.toISOString()).toBe(
      '2026-07-24T12:00:00.000Z',
    );
  });

  it('returns null for empty / invalid values', () => {
    expect(parseServerUtcDate(null)).toBeNull();
    expect(parseServerUtcDate('')).toBeNull();
    expect(parseServerUtcDate('not-a-date')).toBeNull();
  });
});

describe('rules read round-trip (#1230)', () => {
  it('does not mark rules unread after UTC acknowledge → naive API reload', () => {
    const rulesUpdatedAt = parseServerUtcDate('2026-07-24T12:00:00');
    // Client posts toISOString(); server stores and later dumps without Z.
    const acknowledgedFromApi = parseServerUtcDate(
      rulesUpdatedAt!
        .toISOString()
        .replace('Z', '')
        .replace(/\.\d{3}/, ''),
    );

    expect(isRulesUnread(acknowledgedFromApi, rulesUpdatedAt)).toBeFalse();
  });

  it('still detects a newer rules version as unread', () => {
    const acknowledged = parseServerUtcDate('2026-07-24T12:00:00');
    const current = parseServerUtcDate('2026-07-25T08:00:00');
    expect(isRulesUnread(acknowledged, current)).toBeTrue();
  });
});
