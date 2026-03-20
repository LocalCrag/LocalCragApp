import {
  deserializeLCObject,
  getObjectType,
  LCObject,
  ObjectType,
} from './object';

export class Tag {
  object: LCObject;
  objectType: ObjectType;

  public static serialize(tag: Tag): any {
    return {
      objectType: getObjectType(tag.object),
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
}
