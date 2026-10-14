import { Line } from '../../models/line';
import { lineHistoryLocation } from './line-history-location';

describe('lineHistoryLocation', () => {
  it('reads area, sector, and crag nested on a history line payload', () => {
    const line = Line.deserialize({
      id: 'line-1',
      name: 'The Vessel',
      slug: 'the-vessel',
      area: {
        id: 'area-1',
        name: 'Shark Attack',
        slug: 'shark-attack',
        sector: {
          id: 'sector-1',
          name: 'Pampelmousse',
          slug: 'pampelmousse',
          crag: {
            id: 'crag-1',
            name: 'Brione',
            slug: 'brione',
          },
        },
      },
    });

    expect(lineHistoryLocation(line)).toEqual({
      area: { name: 'Shark Attack', slug: 'shark-attack' },
      sector: { name: 'Pampelmousse', slug: 'pampelmousse' },
      crag: { name: 'Brione', slug: 'brione' },
    });
  });

  it('returns null when the line has no area', () => {
    const line = Line.deserialize({
      id: 'line-1',
      name: 'Orphan',
      slug: 'orphan',
    });

    expect(lineHistoryLocation(line)).toBeNull();
  });
});
