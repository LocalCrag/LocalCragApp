import { Tag } from './tag';
import { AbstractModel } from './abstract-model';
import { File } from './file';
import { User } from './user';

export class GalleryImage extends AbstractModel {
  image: File;
  description: string | null;
  lat: number | null;
  lng: number | null;
  tags: Tag[];
  createdBy: User;

  public static deserialize(payload: any): GalleryImage {
    const galleryImage = new GalleryImage();
    AbstractModel.deserializeAbstractAttributes(galleryImage, payload);
    galleryImage.image = payload.image ? File.deserialize(payload.image) : null;
    galleryImage.description = payload.description ?? null;
    galleryImage.lat = payload.lat ?? null;
    galleryImage.lng = payload.lng ?? null;
    galleryImage.tags = payload.tags ? payload.tags.map(Tag.deserialize) : null;
    galleryImage.createdBy = User.deserialize(payload.createdBy);
    return galleryImage;
  }

  public static serializeForCreate(galleryImage: GalleryImage): any {
    return {
      fileId: galleryImage.image.id,
      description: galleryImage.description ?? null,
      tags: galleryImage.tags ? galleryImage.tags.map(Tag.serialize) : null,
    };
  }

  public static serializeForUpdate(galleryImage: GalleryImage): any {
    return {
      tags: galleryImage.tags ? galleryImage.tags.map(Tag.serialize) : [],
      description: galleryImage.description ?? null,
      lat: galleryImage.lat ?? null,
      lng: galleryImage.lng ?? null,
    };
  }
}
