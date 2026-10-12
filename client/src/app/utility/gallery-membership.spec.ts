import { Area } from '../models/area';
import { Crag } from '../models/crag';
import { GalleryImage } from '../models/gallery-image';
import { Line } from '../models/line';
import { ObjectType } from '../models/object';
import { Sector } from '../models/sector';
import { Tag } from '../models/tag';
import { User } from '../models/user';
import { galleryImageBelongsToObject } from './gallery-membership';

function imageWith(tag: Tag): GalleryImage {
  const image = new GalleryImage();
  image.tags = [tag];
  return image;
}

function tagFor(object: Tag['object'], objectType: ObjectType): Tag {
  const tag = new Tag();
  tag.object = object;
  tag.objectType = objectType;
  return tag;
}

describe('gallery membership after a tag edit', () => {
  const crag = new Crag();
  crag.slug = 'brione';

  const sector = new Sector();
  sector.slug = 'es';
  sector.crag = crag;

  const otherSector = new Sector();
  otherSector.slug = 'mordor';
  otherSector.crag = crag;

  const area = new Area();
  area.slug = 'black-gate';
  area.sector = sector;

  const line = new Line();
  line.slug = 'super-spreader';
  line.area = area;

  it('keeps a photo tagged with the gallery object', () => {
    const image = imageWith(tagFor(sector, ObjectType.Sector));
    expect(
      galleryImageBelongsToObject(image, ObjectType.Sector, 'es'),
    ).toBeTrue();
  });

  it('keeps a child line tag in the parent sector gallery', () => {
    const image = imageWith(tagFor(line, ObjectType.Line));
    expect(
      galleryImageBelongsToObject(image, ObjectType.Sector, 'es'),
    ).toBeTrue();
    expect(
      galleryImageBelongsToObject(image, ObjectType.Crag, 'brione'),
    ).toBeTrue();
    expect(
      galleryImageBelongsToObject(image, ObjectType.Area, 'black-gate'),
    ).toBeTrue();
  });

  it('drops a photo whose tag was replaced with another sector', () => {
    const image = imageWith(tagFor(otherSector, ObjectType.Sector));
    expect(
      galleryImageBelongsToObject(image, ObjectType.Sector, 'es'),
    ).toBeFalse();
  });

  it('keeps a user tag only on that user gallery', () => {
    const user = new User();
    user.slug = 'ada';
    const image = imageWith(tagFor(user, ObjectType.User));
    expect(
      galleryImageBelongsToObject(image, ObjectType.User, 'ada'),
    ).toBeTrue();
    expect(
      galleryImageBelongsToObject(image, ObjectType.User, 'grace'),
    ).toBeFalse();
    expect(
      galleryImageBelongsToObject(image, ObjectType.Sector, 'es'),
    ).toBeFalse();
  });

  it('keeps every photo when the gallery has no object filter', () => {
    const image = imageWith(tagFor(otherSector, ObjectType.Sector));
    expect(galleryImageBelongsToObject(image, undefined, undefined)).toBeTrue();
  });
});
