import { Tag } from './tag';
import { AbstractModel } from './abstract-model';
import { File } from './file';
import { User } from './user';

export class GalleryImage extends AbstractModel {
  image: File;
  description: string | null;
  tags: Tag[];
  createdBy: User;
  /** When true, serializeForUpdate includes lat/lng from image. */
  updateCoordinates = false;

  public static deserialize(payload: any): GalleryImage {
    const galleryImage = new GalleryImage();
    AbstractModel.deserializeAbstractAttributes(galleryImage, payload);
    galleryImage.image = payload.image ? File.deserialize(payload.image) : null;
    galleryImage.description = payload.description ?? null;
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
    const payload: Record<string, unknown> = {};
    if (galleryImage.tags != null) {
      payload.tags = galleryImage.tags.map(Tag.serialize);
    }
    // Only send when set so tag-only updates (gallery form) keep existing descriptions.
    if (galleryImage.description !== undefined) {
      payload.description = galleryImage.description ?? null;
    }
    if (galleryImage.updateCoordinates && galleryImage.image) {
      payload.lat = galleryImage.image.lat ?? null;
      payload.lng = galleryImage.image.lng ?? null;
    }
    return payload;
  }
}
