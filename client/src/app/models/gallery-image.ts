import { Tag } from './tag';
import { AbstractModel } from './abstract-model';
import { File } from './file';

export class GalleryImage extends AbstractModel {
  image: File;
  tags: Tag[];

  public static deserialize(payload: any): GalleryImage {
    const galleryImage = new GalleryImage();
    AbstractModel.deserializeAbstractAttributes(galleryImage, payload);
    galleryImage.image = payload.image ? File.deserialize(payload.image) : null;
    galleryImage.tags = payload.tags ? payload.tags.map(Tag.deserialize) : null;
    return galleryImage;
  }

  public static serialize(galleryImage: GalleryImage): any {
    return {
      image: galleryImage.image.id,
      tags: galleryImage.tags ? galleryImage.tags.map(Tag.serialize) : null,
    };
  }
}
