import { Crag } from './crag';
import { Sector } from './sector';
import { Area } from './area';
import { User } from './user';
import { Post } from './post';
import { Region } from './region';
import { Line } from './line';

export enum ObjectType {
  Crag = 'Crag',
  Sector = 'Sector',
  Area = 'Area',
  Line = 'Line',
  User = 'User',
  Post = 'Post',
  Region = 'Region',
}

export type LCObject = Region | Crag | Sector | Area | Line | User | Post;

export const getObjectType = (object: LCObject): ObjectType => {
  if (object instanceof Crag) {
    return ObjectType.Crag;
  } else if (object instanceof Sector) {
    return ObjectType.Sector;
  } else if (object instanceof Area) {
    return ObjectType.Area;
  } else if (object instanceof Line) {
    return ObjectType.Line;
  } else if (object instanceof User) {
    return ObjectType.User;
  } else if (object instanceof Post) {
    return ObjectType.Post;
  } else if (object instanceof Region) {
    return ObjectType.Region;
  } else {
    throw new Error('Unknown object type');
  }
};

export const deserializeLCObject = (
  objectType: ObjectType,
  payload: any,
): LCObject => {
  switch (objectType) {
    case 'Line':
      return Line.deserialize(payload);
    case 'Area':
      return Area.deserialize(payload);
    case 'Sector':
      return Sector.deserialize(payload);
    case 'Crag':
      return Crag.deserialize(payload);
    case 'Region':
      return Region.deserialize(payload);
    case 'User':
      return User.deserialize(payload);
    case 'Post':
      return Post.deserialize({ ...payload, text: '' }); // PostSearchSchema has no text
    default:
      return null;
  }
};
