import { AbstractModel } from './abstract-model';
import { User } from './user';
import { Crag } from './crag';
import { Sector } from './sector';
import { Area } from './area';
import { Line } from './line';
import { Region } from './region';
import { Post } from './post';

export type CommentTarget = Line | Area | Sector | Crag | Region | Post;
export type CommentObjectType =
  | 'Line'
  | 'Area'
  | 'Sector'
  | 'Crag'
  | 'Region'
  | 'Post';

export class Comment extends AbstractModel {
  message: string;
  object: CommentTarget;
  objectType: CommentObjectType;
  parentId?: string;
  createdBy: User;

  public static deserialize(payload: any): Comment {
    const comment = new Comment();
    AbstractModel.deserializeAbstractAttributes(comment, payload);
    comment.message = payload.message;
    comment.object = payload.object
      ? Comment.deserializeRelatedObject(payload.objectType, payload.object)
      : null;
    comment.objectType = payload.objectType;
    comment.parentId = payload.parentId;
    comment.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    return comment;
  }

  private static deserializeRelatedObject(
    objectType: CommentObjectType,
    payload: any,
  ): CommentTarget {
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
      case 'Post':
        return Post.deserialize({ ...payload, text: '' }); // PostSearchSchema has no text
      default:
        return null;
    }
  }

  public static serializeForCreate(comment: Comment): any {
    return {
      message: comment.message,
      objectType: comment.objectType,
      objectId: (comment.object as any)?.id,
      parentId: comment.parentId ?? null,
    };
  }

  public static serializeForUpdate(comment: Comment): any {
    return {
      message: comment.message,
    };
  }
}

export interface PaginatedComments {
  items: Comment[];
  hasNext: boolean;
}
