import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { Comment, CommentObjectType } from '../../models/comment';
import { Paginated } from '../../models/paginated';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getComments(
    objectType: CommentObjectType,
    objectId: string,
    page?: number,
    perPage?: number,
  ): Observable<Paginated<Comment>> {
    const params = new URLSearchParams();
    params.set('object_type', objectType);
    params.set('object_id', objectId);
    if (page) params.set('page', String(page));
    if (perPage) params.set('per_page', String(perPage));
    return this.http
      .get(this.api.comments.getList(`?${params.toString()}`))
      .pipe(
        map((payload) => Paginated.deserialize(payload, Comment.deserialize)),
      );
  }

  public createComment(comment: Comment): Observable<Comment> {
    return this.http
      .post(this.api.comments.create(), Comment.serializeForCreate(comment))
      .pipe(map(Comment.deserialize));
  }

  public updateComment(
    commentId: string,
    message: string,
  ): Observable<Comment> {
    return this.http
      .put(this.api.comments.update(commentId), { message })
      .pipe(map(Comment.deserialize));
  }

  public deleteComment(commentId: string): Observable<null> {
    return this.http
      .delete(this.api.comments.delete(commentId))
      .pipe(map(() => null));
  }
}
