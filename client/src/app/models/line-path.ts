import { AbstractModel } from './abstract-model';
import { Line } from './line';
import Konva from 'konva';
import { LoadingState } from '../enums/loading-state';
import {
  deserializeOrderIndexAttributes,
  HasOrderIndex,
} from './mixins/has-order-index';

/**
 * Model of a line path.
 */
export class LinePath extends HasOrderIndex(AbstractModel) {
  path: number[];
  line: Line;

  // Properties for UI features
  loadingState: LoadingState = LoadingState.DEFAULT;
  konvaLine: Konva.Line;
  konvaNumberGroup: Konva.Group;
  konvaRect: Konva.Rect;
  konvaText: Konva.Text;
  konvaLineLayer: Konva.Layer;
  konvaNumberLayer: Konva.Layer;
  konvaFocusLayer: Konva.Layer;

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
    deserializeOrderIndexAttributes(linePath, payload);
    linePath.path = payload.path;
    linePath.line = payload.line ? Line.deserialize(payload.line) : null;
    return linePath;
  }

  /**
   * Marshals line paths for sync requests.
   *
   * @param linePaths Line paths in display order.
   * @return Marshalled sync payload.
   */
  public static serializeForSync(linePaths: LinePath[]): any {
    return {
      linePaths: linePaths.map((linePath) => ({
        ...(linePath.id ? { id: linePath.id } : {}),
        line: linePath.line.id,
        path: linePath.path,
      })),
    };
  }
}
