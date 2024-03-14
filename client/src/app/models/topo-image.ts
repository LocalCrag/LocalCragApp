import {AbstractModel} from './abstract-model';
import {File} from './file';
import {LinePath} from './line-path';
import {LoadingState} from '../enums/loading-state';

/**
 * Model of a topo image.
 */
export class TopoImage extends AbstractModel {

  image: File;
  linePaths: LinePath[];
  orderIndex: number;
  lat: number;
  lng: number;
  title: string;
  description: string;

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
    topoImage.lng = payload.lng;
    topoImage.lat = payload.lat;
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
      lng: topoImage.lng,
      lat: topoImage.lat,
      title: topoImage.title,
      description: topoImage.description,
    };
  }

}
