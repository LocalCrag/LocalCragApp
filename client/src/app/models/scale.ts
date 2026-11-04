import { LineType } from '../enums/line-type';

export interface Grade {
  name: string;
  value: number;
}

export type StackedChartBracket = {
  value: number;
  color: string;
};
export type StackedChartBrackets = StackedChartBracket[];
export type BarChartBracket = {
  name: string;
  value: number;
};
export type BarChartBrackets = BarChartBracket[];

export type GradeDistribution = Record<
  LineType,
  Record<string, Record<number, number>>
>;

export function deserializeGradeList(payload: any): GradeDistribution {
  return payload;
}

export function defaultScaleName(
  scales: Scale[],
  lineType: LineType,
): string | null {
  return (
    scales.find((scale) => scale.lineType === lineType && scale.isDefault)
      ?.name ?? null
  );
}

export class Scale {
  lineType: LineType;
  name: string;
  isDefault: boolean;
  grades?: Grade[];
  gradeBrackets: {
    stackedChartBrackets: StackedChartBrackets;
    barChartBrackets: BarChartBrackets;
    showDiagrams: boolean;
  };

  public static deserialize(payload: any): Scale {
    const scale = new Scale();
    scale.lineType = payload.type;
    scale.name = payload.name;
    scale.isDefault = payload.isDefault;
    scale.grades = payload.grades;
    scale.gradeBrackets = payload.gradeBrackets;

    return scale;
  }

  // For some endpoints, we know that we receive the full scale
  public static deserializeFull(payload: any): Required<Scale> {
    const scale = new Scale();
    scale.lineType = payload.type;
    scale.name = payload.name;
    scale.isDefault = payload.isDefault;
    scale.grades = payload.grades;
    scale.gradeBrackets = payload.gradeBrackets;

    return scale as Required<Scale>;
  }

  public static serialize(scale: Scale): any {
    return {
      type: scale.lineType,
      name: scale.name,
      grades: scale.grades,
      gradeBrackets: scale.gradeBrackets,
    };
  }
}

export type FullScale = Required<Scale>;
