import { Injectable } from '@angular/core';
import { LCObject } from '../../models/object';
import { Comment } from '../../models/comment';

@Injectable()
export class CommentsContextService {
  private commentMap: Map<string, Comment> = new Map();

  public addComments(comments: Comment[]): void {
    comments.forEach((comment) => {
      this.commentMap.set(comment.id, comment);
    });
  }

  public getCommentById(commentId: string): Comment {
    const comment = this.commentMap.get(commentId);
    if (!comment) {
      throw new Error(`Comment with ID ${commentId} not found in context.`);
    }
    return comment;
  }

  get object(): LCObject {
    return this._object;
  }

  set object(value: LCObject) {
    this._object = value;
  }

  private _object: LCObject;
}
