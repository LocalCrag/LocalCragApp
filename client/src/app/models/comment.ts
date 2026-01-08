import { AbstractModel } from './abstract-model';
import { User } from './user';
import { Crag } from './crag';
import { Sector } from './sector';
import { Area } from './area';
import { Line } from './line';
import { Region } from './region';
import { Post } from './post';
import { LCObject, ObjectType } from './object';

export class Comment extends AbstractModel {
  message: string;
  object: LCObject;
  objectType: ObjectType;
  parentId?: string;
  rootId?: string;
  createdBy: User;
  replyCount?: number;
  isDeleted: boolean;
  routerLinkCreatedBy: string;

  public static deserialize(payload: any): Comment {
    const comment = new Comment();
    AbstractModel.deserializeAbstractAttributes(comment, payload);
    comment.message = payload.message;
    comment.object = payload.object
      ? Comment.deserializeRelatedObject(payload.objectType, payload.object)
      : null;
    comment.objectType = payload.objectType;
    comment.parentId = payload.parentId;
    comment.rootId = payload.rootId;
    comment.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    comment.replyCount = payload.replyCount ?? 0;
    comment.isDeleted = payload.isDeleted;

    comment.routerLinkCreatedBy = comment.createdBy
      ? `/users/${comment.createdBy.slug}`
      : null;

    return comment;
  }

  private static deserializeRelatedObject(
    objectType: ObjectType,
    payload: any,
  ): LCObject {
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
}
