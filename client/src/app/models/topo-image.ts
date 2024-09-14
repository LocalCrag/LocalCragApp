import {AbstractModel} from './abstract-model';
import {File} from './file';
import {LinePath} from './line-path';
import {LoadingState} from '../enums/loading-state';
import {Coordinates} from '../interfaces/coordinates.interface';
import {MapMarkerType} from '../enums/map-marker-type';
import {Area} from './area';

/**
 * Model of a topo image.
 */
export class TopoImage extends AbstractModel {

  image: File;
  linePaths: LinePath[];
  orderIndex: number;
  coordinates: Coordinates;
  title: string;
  description: string;
  area: Area;

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
    topoImage.image =  File.deserialize(payload.image);
    topoImage.orderIndex = payload.orderIndex;
    // We parse the map parker into simple coordinates object for topo images
    topoImage.coordinates = payload.mapMarkers?.length > 0 ? {lat: payload.mapMarkers[0].lat, lng: payload.mapMarkers[0].lng} : null;
    topoImage.title = payload.title;
    topoImage.description = payload.description;
    topoImage.linePaths = payload.linePaths ? payload.linePaths.map(LinePath.deserialize) : null;
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
      mapMarkers: topoImage.coordinates ? [{lat: topoImage.coordinates.lat, lng: topoImage.coordinates.lng, type: MapMarkerType.TOPO_IMAGE, description: null, name: null}] : [],
      title: topoImage.title,
      description: topoImage.description,
    };
  }

}
