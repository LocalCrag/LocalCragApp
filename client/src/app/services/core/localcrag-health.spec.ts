import {
  isBelowMinApiVersion,
  isLocalCragHealthResponse,
  LOCALCRAG_HEALTH_PRODUCT,
  LOCALCRAG_MIN_API_VERSION,
} from './localcrag-health';

describe('isLocalCragHealthResponse', () => {
  it('accepts legacy health with server healthy (no product/version)', () => {
    expect(
      isLocalCragHealthResponse({
        server: 'healthy',
        database: 'healthy',
        s3: 'healthy',
      }),
    ).toBeTrue();
  });

  it('accepts health with product constant and version', () => {
    expect(
      isLocalCragHealthResponse({
        server: 'healthy',
        product: LOCALCRAG_HEALTH_PRODUCT,
        version: '1.51.0',
      }),
    ).toBeTrue();
  });

  it('rejects wrong product constant when present', () => {
    expect(
      isLocalCragHealthResponse({
        server: 'healthy',
        product: 'other',
        version: '1.51.0',
      }),
    ).toBeFalse();
  });

  it('rejects when server is not healthy', () => {
    expect(
      isLocalCragHealthResponse({
        server: 'down',
      }),
    ).toBeFalse();
  });
});

describe('isBelowMinApiVersion', () => {
  it('detects when remote is below min (helper reserved for follow-up)', () => {
    expect(isBelowMinApiVersion('1.50.0', '1.51.0')).toBeTrue();
  });

  it('does not flag when remote equals or exceeds min', () => {
    expect(
      isBelowMinApiVersion('1.51.0', LOCALCRAG_MIN_API_VERSION),
    ).toBeFalse();
    expect(
      isBelowMinApiVersion('1.52.0', LOCALCRAG_MIN_API_VERSION),
    ).toBeFalse();
  });
});
