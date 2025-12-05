import { Crag } from './crag';
import { Sector } from './sector';
import { Area } from './area';
import { Line } from './line';
import { User } from './user';
import { deserializeObject } from './utils';
import { ObjectType } from './object';

export class Tag {
  object: Crag | Sector | Area | Line | User;
  objectType: ObjectType;

  public static serialize(tag: Tag): any {
    let objectType: string;
    // TODO make this a util
    if (tag.object instanceof Crag) {
      objectType = ObjectType.Crag;
    }
    if (tag.object instanceof Sector) {
      objectType = ObjectType.Sector;
    }
    if (tag.object instanceof Area) {
      objectType = ObjectType.Area;
    }
    if (tag.object instanceof Line) {
      objectType = ObjectType.Line;
    }
    if (tag.object instanceof User) {
      objectType = ObjectType.User;
    }
    return {
      objectType: objectType,
      objectId: tag.object.id,
    };
  }

  public static deserialize(payload: any): Tag {
    const tag = new Tag();
    tag.object = payload.object
      ? deserializeObject(payload.objectType, payload.object)
      : null;
    tag.objectType = payload.objectType;
    return tag;
  }
}
