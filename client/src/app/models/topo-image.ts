import {AbstractModel} from './abstract-model';
import {File} from './file';
import {LinePath} from './line-path';

/**
 * Model of a topo image.
 */
export class TopoImage extends AbstractModel {

  image: File;
  linePaths: LinePath[];

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
    topoImage.linePaths = payload.linePaths.map(LinePath.deserialize);
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
    };
  }

}
