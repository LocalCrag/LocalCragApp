import { AbstractModel } from './abstract-model';
import { File } from './file';
import { LinePath } from './line-path';
import { LoadingState } from '../enums/loading-state';
import { Area } from './area';
import { MapMarker } from './map-marker';
import {
  deserializeOrderIndexAttributes,
  HasOrderIndex,
} from './mixins/has-order-index';
import { deserializeTabuAreas, TabuArea } from '../utility/topo/tabu-holds';

/**
 * Model of a topo image.
 */
export class TopoImage extends HasOrderIndex(AbstractModel) {
  image: File;
  linePaths: LinePath[];
  tabuAreas: TabuArea[] = [];
  mapMarker: MapMarker | null;
  title: string;
  description: string;
  area: Area;
  publicationStatus: string;
  createdById: string | null;

  // Properties for UI features
  loadingState: LoadingState = LoadingState.DEFAULT;

  /**
   * Parses a topo image.
   *
   * @param payload Topo image json payload.
   * @return Parsed TopoImage.
   */
  public static deserialize(payload: any): TopoImage {
    const topoImage = new TopoImage();
    AbstractModel.deserializeAbstractAttributes(topoImage, payload);
    deserializeOrderIndexAttributes(topoImage, payload);
    topoImage.image = File.deserialize(payload.image);
    topoImage.mapMarker = payload.mapMarkers?.[0]
      ? MapMarker.deserialize(payload.mapMarkers[0])
      : null;
    topoImage.title = payload.title;
    topoImage.description = payload.description;
    topoImage.linePaths = payload.linePaths
      ? payload.linePaths.map(LinePath.deserialize)
      : null;
    topoImage.tabuAreas = deserializeTabuAreas(payload.tabuAreas);
    topoImage.publicationStatus = payload.publicationStatus ?? 'published';
    topoImage.createdById = payload.createdById ?? null;
    topoImage.area = payload.area ? Area.deserialize(payload.area) : null;
    return topoImage;
  }

  /**
   * Marshals a topo image.
   *
   * @param topoImage TopoImage to marshall.
   * @return Marshalled TopoImage.
   */
  public static serialize(topoImage: TopoImage): any {
    return {
      image: topoImage.image.id,
      mapMarkers: topoImage.mapMarker
        ? [MapMarker.serialize(topoImage.mapMarker)]
        : [],
      title: topoImage.title,
      description: topoImage.description,
    };
  }
}
