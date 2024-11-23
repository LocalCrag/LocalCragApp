import { LineType } from '../enums/line-type';

export interface Grade {
  name: string;
  value: number;
}

export function deserializeGrade(payload: any): Grade {
  return {
    name: payload.gradeName,
    value: -42, // todo
  };
}

export class Scale {
  lineType: LineType;
  name: string;
  grades?: Grade[];

  public static deserialize(payload: any): Scale {
    const scale = new Scale();
    scale.lineType = payload.type;
    scale.name = payload.name;
    scale.grades = payload.grades;

    return scale;
  }

  // For some endpoints, we know that we receive the full scale
  public static deserializeFull(payload: any): Required<Scale> {
    const scale = new Scale();
    scale.lineType = payload.type;
    scale.name = payload.name;
    scale.grades = payload.grades;

    return scale as Required<Scale>;
  }

  public static serialize(scale: Scale): any {
    return {
      type: scale.lineType,
      name: scale.name,
      grades: scale.grades,
    };
  }
}
