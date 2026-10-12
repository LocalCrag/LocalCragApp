import { Area } from '../models/area';
import { GalleryImage } from '../models/gallery-image';
import { Crag } from '../models/crag';
import { Line } from '../models/line';
import { ObjectType } from '../models/object';
import { Sector } from '../models/sector';
import { Tag } from '../models/tag';
import { User } from '../models/user';

/**
 * Whether a saved gallery image still belongs in the gallery for `objectType`
 * and `objectSlug`.
 *
 * Child tags count: a line tag still belongs in its area, sector, and crag
 * galleries. A gallery with no object filter (the region gallery) keeps every
 * image.
 */
export function galleryImageBelongsToObject(
  image: GalleryImage,
  objectType: ObjectType | null | undefined,
  objectSlug: string | null | undefined,
): boolean {
  if (!objectType || !objectSlug) {
    return true;
  }
  return (image.tags ?? []).some((tag) =>
    tagMatchesGallery(tag, objectType, objectSlug),
  );
}

function tagMatchesGallery(
  tag: Tag,
  objectType: ObjectType,
  objectSlug: string,
): boolean {
  const object = tag.object;
  if (object instanceof Line) {
    return (
      (objectType === ObjectType.Line && object.slug === objectSlug) ||
      (objectType === ObjectType.Area && object.area?.slug === objectSlug) ||
      (objectType === ObjectType.Sector &&
        object.area?.sector?.slug === objectSlug) ||
      (objectType === ObjectType.Crag &&
        object.area?.sector?.crag?.slug === objectSlug)
    );
  }
  if (object instanceof Area) {
    return (
      (objectType === ObjectType.Area && object.slug === objectSlug) ||
      (objectType === ObjectType.Sector &&
        object.sector?.slug === objectSlug) ||
      (objectType === ObjectType.Crag &&
        object.sector?.crag?.slug === objectSlug)
    );
  }
  if (object instanceof Sector) {
    return (
      (objectType === ObjectType.Sector && object.slug === objectSlug) ||
      (objectType === ObjectType.Crag && object.crag?.slug === objectSlug)
    );
  }
  if (object instanceof Crag) {
    return objectType === ObjectType.Crag && object.slug === objectSlug;
  }
  if (object instanceof User) {
    return objectType === ObjectType.User && object.slug === objectSlug;
  }
  return false;
}
