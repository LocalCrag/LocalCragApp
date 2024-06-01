import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Post} from '../../models/post';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

/**
 * CRUD service for posts.
 */
@Injectable({
  providedIn: 'root'
})
export class PostsService {

  constructor(private api: ApiService,
              private http: HttpClient) {
  }

  /**
   * Creates a Post.
   *
   * @param post Post to persist.
   * @return Observable of a Post.
   */
  public createPost(post: Post): Observable<Post> {
    return this.http.post(this.api.posts.create(), Post.serialize(post)).pipe(
      map(Post.deserialize)
    );
  }

  /**
   * Returns a list of Posts.
   *
   * @return Observable of a list of Posts.
   */
  public getPosts(): Observable<Post[]> {
    return this.http.get(this.api.posts.getList()).pipe(map((postListJson: any) => postListJson.map(Post.deserialize)));
  }

  /**
   * Returns a Post.
   *
   * @param slug Slug of the Post to load.
   * @return Observable of a Post.
   */
  public getPost(slug: string): Observable<Post> {
    return this.http.get(this.api.posts.getDetail(slug)).pipe(map(Post.deserialize));
  }

  /**
   * Deletes a Post.
   *
   * @param post Post to delete.
   * @return Observable of a Post.
   */
  public deletePost(post: Post): Observable<null> {
    return this.http.delete(this.api.posts.delete(post.slug)).pipe(
      map(() => null)
    );
  }

  /**
   * Updates a Post.
   *
   * @param post Post to persist.
   * @return Observable of null.
   */
  public updatePost(post: Post): Observable<Post> {
    return this.http.put(this.api.posts.update(post.slug), Post.serialize(post)).pipe(
      map(Post.deserialize)
    );
  }


}
