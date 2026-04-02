import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { Reaction, Reactions } from '../../models/reactions';

@Injectable({
  providedIn: 'root',
})
export class ReactionsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public createReaction(
    targetType: string,
    targetId: string,
    emoji: string,
  ): Observable<Reactions> {
    return this.http
      .post<any[]>(this.api.reactions.create(targetType, targetId), { emoji })
      .pipe(map((payload) => payload.map(Reaction.deserialize)));
  }

  public updateReaction(
    targetType: string,
    targetId: string,
    emoji: string,
  ): Observable<Reactions> {
    return this.http
      .put<any[]>(this.api.reactions.update(targetType, targetId), { emoji })
      .pipe(map((payload) => payload.map(Reaction.deserialize)));
  }

  public deleteReaction(
    targetType: string,
    targetId: string,
  ): Observable<Reactions> {
    return this.http
      .delete<any[]>(this.api.reactions.delete(targetType, targetId))
      .pipe(map((payload) => payload.map(Reaction.deserialize)));
  }
}
