import {
  $applyNodeReplacement,
  type DOMConversionOutput,
  type DOMExportOutput,
  ElementNode,
  type LexicalNode,
  type NodeKey,
} from 'lexical';
import {
  imageWidth,
  safeMediaUrl,
  writeMediaWidth,
  type WysiwygMediaWidth,
} from './wysiwyg-html';

export type WysiwygVideoKind = 'iframe' | 'file';

export class WysiwygVideoNode extends ElementNode {
  __src: string;
  __kind: WysiwygVideoKind;
  __width: WysiwygMediaWidth;

  constructor(
    src = '',
    kind: WysiwygVideoKind = 'iframe',
    width: WysiwygMediaWidth = null,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__kind = kind;
    this.__width = width;
  }

  override $config() {
    return this.config('wysiwyg-video', {
      extends: ElementNode,
      inline: true,
      importDOM: {
        iframe: () => ({
          conversion: (domNode: HTMLElement) =>
            $convertWysiwygVideo(domNode, 'iframe'),
          priority: 1 as const,
        }),
        video: () => ({
          conversion: (domNode: HTMLElement) =>
            $convertWysiwygVideo(domNode, 'file'),
          priority: 1 as const,
        }),
      },
    });
  }

  override afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__src = prevNode.__src;
    this.__kind = prevNode.__kind;
    this.__width = prevNode.__width;
  }

  getSrc(): string {
    return this.getLatest().__src;
  }

  getWidth(): WysiwygMediaWidth {
    return this.getLatest().__width;
  }

  setWidth(width: WysiwygMediaWidth): this {
    const writable = this.getWritable();
    writable.__width = width;
    return writable;
  }

  override createDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'lc-wysiwyg-embed';
    span.contentEditable = 'false';
    span.setAttribute('data-wysiwyg-key', this.getKey());
    span.append(buildMediaElement(this.__kind, this.__src, this.__width));
    applyEmbedWidth(span, this.__width);
    if (this.__kind === 'iframe') {
      const shield = document.createElement('span');
      shield.className = 'lc-wysiwyg-embed-shield';
      span.append(shield);
    }
    return span;
  }

  override updateDOM(prevNode: this, dom: HTMLElement): boolean {
    if (prevNode.__kind !== this.__kind) {
      return true;
    }
    const media = dom.querySelector('iframe, video');
    if (!(media instanceof HTMLElement)) {
      return true;
    }
    if (prevNode.__src !== this.__src) {
      media.setAttribute('src', this.__src);
    }
    if (prevNode.__width !== this.__width) {
      writeMediaWidth(media, this.__width);
      applyEmbedWidth(dom, this.__width);
    }
    return false;
  }

  override exportDOM(): DOMExportOutput {
    return {
      element: buildMediaElement(this.__kind, this.__src, this.__width),
    };
  }

  override exportJSON() {
    return {
      ...super.exportJSON(),
      kind: this.__kind,
      src: this.__src,
      width: this.__width,
    };
  }

  override isInline(): true {
    return true;
  }

  override canBeEmpty(): boolean {
    return true;
  }

  override canInsertTextBefore(): false {
    return false;
  }

  override canInsertTextAfter(): false {
    return false;
  }
}

function applyEmbedWidth(embed: HTMLElement, width: WysiwygMediaWidth) {
  embed.style.width = width === 'full' ? '100%' : '';
}

function buildMediaElement(
  kind: WysiwygVideoKind,
  src: string,
  width: WysiwygMediaWidth,
): HTMLElement {
  const media =
    kind === 'file'
      ? document.createElement('video')
      : document.createElement('iframe');
  media.setAttribute('src', src);
  if (kind === 'file') {
    media.setAttribute('controls', 'true');
    media.setAttribute('playsinline', 'true');
  } else {
    media.setAttribute('frameborder', '0');
    media.setAttribute('allowfullscreen', 'true');
  }
  writeMediaWidth(media, width);
  return media;
}

function $convertWysiwygVideo(
  domNode: HTMLElement,
  kind: WysiwygVideoKind,
): DOMConversionOutput {
  const src = safeMediaUrl(domNode.getAttribute('src'));
  if (!src) {
    return { node: null };
  }
  return { node: $createWysiwygVideoNode(src, kind, imageWidth(domNode)) };
}

export function $createWysiwygVideoNode(
  src: string,
  kind: WysiwygVideoKind,
  width: WysiwygMediaWidth = null,
): WysiwygVideoNode {
  return $applyNodeReplacement(new WysiwygVideoNode(src, kind, width));
}

export function $isWysiwygVideoNode(
  node: LexicalNode | null | undefined,
): node is WysiwygVideoNode {
  return node instanceof WysiwygVideoNode;
}
