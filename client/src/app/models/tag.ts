import {
  deserializeLCObject,
  getObjectType,
  LCObject,
  ObjectType,
} from './object';
import { Searchable, SearchableObject } from './searchable';

export class Tag {
  object: LCObject;
  objectType: ObjectType;

  public static serialize(tag: Tag): any {
    return {
      objectType: tag.objectType ?? getObjectType(tag.object),
      objectId: tag.object.id,
    };
  }

  public static deserialize(payload: any): Tag {
    const tag = new Tag();
    tag.object = payload.object
      ? deserializeLCObject(payload.objectType, payload.object)
      : null;
    tag.objectType = payload.objectType;
    return tag;
  }

  public static fromSearchable(searchable: Searchable): Tag {
    const tag = new Tag();
    tag.object =
      searchable.line ||
      searchable.area ||
      searchable.sector ||
      searchable.crag ||
      searchable.user;
    tag.objectType = getObjectType(tag.object);
    return tag;
  }

  public static toSearchable(tag: Tag): Searchable {
    return Searchable.fromObject(tag.object as SearchableObject);
  }
}
