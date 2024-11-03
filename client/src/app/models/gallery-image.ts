import { Tag } from './tag';
import { AbstractModel } from './abstract-model';
import { File } from './file';
import { User } from './user';

export class GalleryImage extends AbstractModel {
  image: File;
  tags: Tag[];
  createdBy: User;

  public static deserialize(payload: any): GalleryImage {
    const galleryImage = new GalleryImage();
    AbstractModel.deserializeAbstractAttributes(galleryImage, payload);
    galleryImage.image = payload.image ? File.deserialize(payload.image) : null;
    galleryImage.tags = payload.tags ? payload.tags.map(Tag.deserialize) : null;
    galleryImage.createdBy = User.deserialize(payload.createdBy);
    return galleryImage;
  }

  public static serialize(galleryImage: GalleryImage): any {
    return {
      fileId: galleryImage.image.id,
      tags: galleryImage.tags ? galleryImage.tags.map(Tag.serialize) : null,
    };
  }
}
