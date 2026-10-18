import { Line } from '../../models/line';
import { LinePath } from '../../models/line-path';
import {
  linePathsForTopoCanvas,
  primaryTopoLinePaths,
  variantTopoLinePaths,
} from './line-path-variants';

function path(orderIndex: number, variant: boolean): LinePath {
  const linePath = new LinePath();
  linePath.orderIndex = orderIndex;
  linePath.line = new Line();
  linePath.line.variant = variant;
  linePath.line.name = variant ? `variant-${orderIndex}` : `line-${orderIndex}`;
  return linePath;
}

describe('topo line path variants', () => {
  const paths = [path(0, false), path(1, true), path(2, false)];

  it('keeps non-variants in order and lists variants separately', () => {
    expect(primaryTopoLinePaths(paths).map((item) => item.line.name)).toEqual([
      'line-0',
      'line-2',
    ]);
    expect(variantTopoLinePaths(paths).map((item) => item.line.name)).toEqual([
      'variant-1',
    ]);
  });

  it('drops variants from the canvas until they are included', () => {
    expect(
      linePathsForTopoCanvas(paths, false).map((item) => item.orderIndex),
    ).toEqual([0, 2]);
    expect(
      linePathsForTopoCanvas(paths, true).map((item) => item.orderIndex),
    ).toEqual([0, 1, 2]);
  });

  it('treats a path without a variant flag as a normal line', () => {
    const unmarked = new LinePath();
    unmarked.orderIndex = 0;
    unmarked.line = new Line();
    expect(primaryTopoLinePaths([unmarked])).toEqual([unmarked]);
    expect(variantTopoLinePaths([unmarked])).toEqual([]);
  });
});
