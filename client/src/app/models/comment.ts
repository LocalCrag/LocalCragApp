import { AbstractModel } from './abstract-model';
import { User } from './user';
import { deserializeLCObject, LCObject, ObjectType } from './object';

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
      ? deserializeLCObject(payload.objectType, payload.object)
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

  public static serializeForCreate(comment: Comment): any {
    return {
      message: comment.message,
      objectType: comment.objectType,
      objectId: (comment.object as any)?.id,
      parentId: comment.parentId ?? null,
    };
  }
}
