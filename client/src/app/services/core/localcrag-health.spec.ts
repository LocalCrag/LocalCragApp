import {
  isBelowMinApiVersion,
  isLocalCragHealthResponse,
  LOCALCRAG_HEALTH_PRODUCT,
  LOCALCRAG_MIN_API_VERSION,
} from './localcrag-health';

describe('isLocalCragHealthResponse', () => {
  it('accepts health with product constant and version', () => {
    expect(
      isLocalCragHealthResponse({
        server: 'healthy',
        product: LOCALCRAG_HEALTH_PRODUCT,
        version: '1.51.0',
      }),
    ).toBeTrue();
  });

  it('rejects missing product (strict D-05 / legacy servers)', () => {
    expect(
      isLocalCragHealthResponse({
        server: 'healthy',
        database: 'healthy',
        s3: 'healthy',
      }),
    ).toBeFalse();
  });

  it('rejects wrong product constant', () => {
    expect(
      isLocalCragHealthResponse({
        product: 'other',
        version: '1.51.0',
      }),
    ).toBeFalse();
  });

  it('rejects empty version', () => {
    expect(
      isLocalCragHealthResponse({
        product: LOCALCRAG_HEALTH_PRODUCT,
        version: '',
      }),
    ).toBeFalse();
  });
});

describe('isBelowMinApiVersion', () => {
  it('warns when remote is below min', () => {
    expect(isBelowMinApiVersion('1.50.0', '1.51.0')).toBeTrue();
  });

  it('does not warn when remote equals or exceeds min', () => {
    expect(
      isBelowMinApiVersion('1.51.0', LOCALCRAG_MIN_API_VERSION),
    ).toBeFalse();
    expect(
      isBelowMinApiVersion('1.52.0', LOCALCRAG_MIN_API_VERSION),
    ).toBeFalse();
  });
});
