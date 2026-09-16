import { AbstractModel } from './abstract-model';
import { Line } from './line';
import Konva from 'konva';
import { LoadingState } from '../enums/loading-state';
import {
  deserializeOrderIndexAttributes,
  HasOrderIndex,
} from './mixins/has-order-index';
import {
  cloneTabuAreaIds,
  cloneTabuAreas,
  TabuArea,
} from '../utility/topo/tabu-holds';

/**
 * Model of a line path.
 */
export class LinePath extends HasOrderIndex(AbstractModel) {
  path: number[];
  tabuAreaIds: string[];
  line: Line;

  // Properties for UI features
  loadingState: LoadingState = LoadingState.DEFAULT;
  konvaLine: Konva.Line;
  konvaTabuShapes: Konva.Line[] = [];
  tabuHoldsHiddenUntilHover = false;
  konvaNumberGroup: Konva.Group;
  konvaRect: Konva.Rect;
  konvaText: Konva.Text;
  konvaLineLayer: Konva.Layer;
  konvaNumberLayer: Konva.Layer;
  konvaFocusLayer: Konva.Layer;

  constructor() {
    super();
    this.path = [];
    this.tabuAreaIds = [];
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
    linePath.tabuAreaIds = cloneTabuAreaIds(payload.tabuAreaIds);
    linePath.line = payload.line ? Line.deserialize(payload.line) : null;
    return linePath;
  }

  /**
   * Marshals line paths for sync requests.
   *
   * @param linePaths Line paths in display order.
   * @param tabuAreas Shared tabu polygons stored on the topo image.
   * @return Marshalled sync payload.
   */
  public static serializeForSync(
    linePaths: LinePath[],
    tabuAreas: TabuArea[] = [],
  ): any {
    return {
      tabuAreas: cloneTabuAreas(tabuAreas),
      linePaths: linePaths.map((linePath) => ({
        ...(linePath.id ? { id: linePath.id } : {}),
        line: linePath.line.id,
        path: linePath.path,
        tabuAreaIds: cloneTabuAreaIds(linePath.tabuAreaIds),
      })),
    };
  }
}
