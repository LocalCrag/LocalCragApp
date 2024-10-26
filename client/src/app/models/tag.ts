import { Crag } from './crag';
import { Sector } from './sector';
import { Area } from './area';
import { Line } from './line';
import { User } from './user';

export enum ObjectType {
  Crag = 'Crag',
  Sector = 'Sector',
  Area = 'Area',
  Line = 'Line',
  User = 'User',
}

export class Tag {
  object: Crag | Sector | Area | Line | User;

  public static serialize(tag: Tag): any {
    return {
      objectType: tag.object.constructor.name,
      objectId: tag.object.id,
    };
  }

  public static deserialize(payload: any): Tag {
    const tag = new Tag();
    tag.object = payload.object
      ? Tag.deserializeObject(payload.objectType, payload.object)
      : null;
    return tag;
  }

  public static deserializeObject(
    objectType: ObjectType,
    payload: any,
  ): Crag | Sector | Area | Line | User {
    switch (objectType) {
      case ObjectType.Crag:
        return Crag.deserialize(payload);
      case ObjectType.Sector:
        return Sector.deserialize(payload);
      case ObjectType.Area:
        return Area.deserialize(payload);
      case ObjectType.Line:
        return Line.deserialize(payload);
      case ObjectType.User:
        return User.deserialize(payload);
      default:
        return null;
    }
  }
}
