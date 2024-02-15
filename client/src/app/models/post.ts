import {AbstractModel} from './abstract-model';
import {File} from './file';
import {Observable} from 'rxjs';
import {Grade} from '../utility/misc/grades';
import {User} from './user';

/**
 * Model of a blog post.
 */
export class Post extends AbstractModel {

  title: string;
  text: string;
  slug: string;
  createdBy: User;

  /**
   * Parses a post.
   *
   * @param payload Post json payload.
   * @return Parsed Post.
   */
  public static deserialize(payload: any): Post {
    const post = new Post();
    AbstractModel.deserializeAbstractAttributes(post, payload);
    post.title = payload.title;
    post.text = payload.text;
    post.slug = payload.slug;
    post.createdBy =User.deserialize(payload.createdBy);
    return post;
  }

  /**
   * Marshals a Post.
   *
   * @param post Post to marshall.
   * @return Marshalled Post.
   */
  public static serialize(post: Post): any {
    return {
      title: post.title,
      text: post.text,
    };
  }

}
