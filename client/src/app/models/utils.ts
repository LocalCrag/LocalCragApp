import { Crag } from './crag';
import { Sector } from './sector';
import { Area } from './area';
import { Line } from './line';
import { User } from './user';
import { ObjectType } from './tag';

export const deserializeObject = (
  objectType: ObjectType,
  payload: any,
): Crag | Sector | Area | Line | User => {
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
};
