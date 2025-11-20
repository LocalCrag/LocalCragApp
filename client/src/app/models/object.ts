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
