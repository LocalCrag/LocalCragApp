import { videoEmbed } from '../../../../utility/video-source';
import { safeMediaUrl } from './wysiwyg-html';
import {
  $createWysiwygVideoNode,
  type WysiwygVideoKind,
} from './wysiwyg-video.node';

const FILE_EXTENSION = /\.(mp4|webm|ogg|mov)(\?|#|$)/i;

export function videoNodeForUrl(url: string) {
  const safe = safeMediaUrl(url);
  if (!safe) {
    return null;
  }
  const embed = videoEmbed({ url: safe });
  if (embed.embedUrl) {
    return $createWysiwygVideoNode(embed.embedUrl, 'iframe');
  }
  const kind: WysiwygVideoKind = FILE_EXTENSION.test(safe) ? 'file' : 'iframe';
  return $createWysiwygVideoNode(safe, kind);
}
