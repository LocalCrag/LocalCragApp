import {environment} from '../../environments/environment';
import {AbstractModel} from './abstract-model';

/**
 * Model of a file object.
 */
export class File extends AbstractModel {

  filename: string;
  originalFilename: string;
  width: number;
  height: number;
  thumbnailXS: string;
  thumbnailS: string;
  thumbnailM: string;
  thumbnailL: string;
  thumbnailXL: string;
  path: string;

  /**
   * Parses a file object.
   *
   * @param payload File json payload.
   * @return Parsed file.
   */
  public static deserialize(payload: any): File {
    const media = new File();
    AbstractModel.deserializeAbstractAttributes(media, payload);
    media.filename = payload.filename;
    media.originalFilename = payload.originalFilename;
    media.width = payload.width;
    media.height = payload.height;
    media.path = `${environment.apiHost}/uploads/${payload.filename}`;
    media.thumbnailXS = payload.thumbnailXS ? media.path.replace(/.([^.]*)$/, '_xs.' + '$1') : null;
    media.thumbnailS = payload.thumbnailS ? media.path.replace(/.([^.]*)$/, '_s.' + '$1') : null;
    media.thumbnailM = payload.thumbnailM ? media.path.replace(/.([^.]*)$/, '_m.' + '$1') : null;
    media.thumbnailL = payload.thumbnailL ? media.path.replace(/.([^.]*)$/, '_l.' + '$1') : null;
    media.thumbnailXL = payload.thumbnailXL ? media.path.replace(/.([^.]*)$/, '_xl.' + '$1') : null;
    return media;
  }

  /**
   * Marshals a media.
   *
   * @param media Media object to marshall.
   * @return Marshalled media object.
   */
  public static serialize(media: File): any {
    return media.id;
  }

}
