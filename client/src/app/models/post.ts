import { AbstractModel } from './abstract-model';
import { User } from './user';
import { deserializeSlugAttributes, HasSlug } from './mixins/has-slug';

/**
 * Model of a blog post.
 */
export class Post extends HasSlug(AbstractModel) {
  title: string;
  text: string;
  createdBy: User;
  commentCount: number;

  /**
   * Parses a post.
   *
   * @param payload Post json payload.
   * @return Parsed Post.
   */
  public static deserialize(payload: any): Post {
    const post = new Post();
    AbstractModel.deserializeAbstractAttributes(post, payload);
    deserializeSlugAttributes(post, payload);
    post.title = payload.title;
    post.text = payload.text;
    post.createdBy = payload.createdBy
      ? User.deserialize(payload.createdBy)
      : null;
    post.commentCount = payload.commentCount ?? 0;
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
