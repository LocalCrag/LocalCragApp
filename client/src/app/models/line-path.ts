import {AbstractModel} from './abstract-model';
import {Line} from './line';
import Konva from 'konva';
import {LoadingState} from '../enums/loading-state';

/**
 * Model of a line path.
 */
export class LinePath extends AbstractModel {

  path: number[];
  line: Line;
  konvaLine: Konva.Line;

  // Properties for UI features
  loadingState: LoadingState = LoadingState.DEFAULT;

  constructor() {
    super();
    this.path = [];
  }

  /**
   * Parses a line path.
   *
   * @param payload Topo image json payload.
   * @return Parsed TopoImage.
   */
  public static deserialize(payload: any): LinePath {
    const linePath = new LinePath();
    AbstractModel.deserializeAbstractAttributes(linePath, payload);
    linePath.path =  payload.path;
    linePath.line = payload.line ? Line.deserialize(payload.line) : null;
    return linePath;
  }

  /**
   * Marshals a line path.
   *
   * @param linePath LinePath to marshall.
   * @return Marshalled LinePath.
   */
  public static serialize(linePath: LinePath): any {
    return {
      path: linePath.path,
      line: linePath.line.id
    };
  }

}
