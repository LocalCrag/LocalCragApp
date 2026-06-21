import { StackedChartBracket } from '../../models/scale';

export const DEFAULT_STACKED_CHART_BRACKET_COLORS = [
  '#eab308',
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#f97316',
  '#14b8a6',
  '#6366f1',
  '#64748b',
];

export const normalizeStackedChartBracket = (
  bracket: StackedChartBracket | number,
  index: number,
): StackedChartBracket => {
  if (typeof bracket === 'number') {
    return {
      value: bracket,
      color:
        DEFAULT_STACKED_CHART_BRACKET_COLORS[
          index % DEFAULT_STACKED_CHART_BRACKET_COLORS.length
        ],
    };
  }
  return bracket;
};

export const getStackedChartBracketValue = (
  bracket: StackedChartBracket | number,
): number => {
  return typeof bracket === 'number' ? bracket : bracket.value;
};

export const getStackedChartBracketColor = (
  bracket: StackedChartBracket | number,
  index: number,
): string => {
  if (typeof bracket === 'number') {
    return DEFAULT_STACKED_CHART_BRACKET_COLORS[
      index % DEFAULT_STACKED_CHART_BRACKET_COLORS.length
    ];
  }
  return bracket.color;
};
