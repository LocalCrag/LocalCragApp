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

export class WysiwygImageNode extends ElementNode {
  __src: string;
  __alt: string;
  __width: WysiwygMediaWidth;

  constructor(
    src = '',
    alt = '',
    width: WysiwygMediaWidth = null,
    key?: NodeKey,
  ) {
    super(key);
    this.__src = src;
    this.__alt = alt;
    this.__width = width;
  }

  override $config() {
    return this.config('wysiwyg-image', {
      extends: ElementNode,
      inline: true,
      importDOM: {
        img: () => ({
          conversion: $convertWysiwygImage,
          priority: 1 as const,
        }),
      },
    });
  }

  override afterCloneFrom(prevNode: this): void {
    super.afterCloneFrom(prevNode);
    this.__src = prevNode.__src;
    this.__alt = prevNode.__alt;
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
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__alt;
    writeMediaWidth(img, this.__width);
    span.append(img);
    applyEmbedWidth(span, this.__width);
    return span;
  }

  override updateDOM(prevNode: this, dom: HTMLElement): boolean {
    const img = dom.querySelector('img');
    if (!img) {
      return true;
    }
    if (prevNode.__src !== this.__src) {
      img.src = this.__src;
    }
    if (prevNode.__alt !== this.__alt) {
      img.alt = this.__alt;
    }
    if (prevNode.__width !== this.__width) {
      writeMediaWidth(img, this.__width);
      applyEmbedWidth(dom, this.__width);
    }
    return false;
  }

  override exportDOM(): DOMExportOutput {
    const img = document.createElement('img');
    img.setAttribute('src', this.__src);
    if (this.__alt) {
      img.setAttribute('alt', this.__alt);
    }
    writeMediaWidth(img, this.__width);
    return { element: img };
  }

  override exportJSON() {
    return {
      ...super.exportJSON(),
      alt: this.__alt,
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

function $convertWysiwygImage(domNode: HTMLElement): DOMConversionOutput {
  const src = safeMediaUrl(domNode.getAttribute('src'));
  if (!src) {
    return { node: null };
  }
  return {
    node: $createWysiwygImageNode(
      src,
      domNode.getAttribute('alt') || '',
      imageWidth(domNode),
    ),
  };
}

function applyEmbedWidth(embed: HTMLElement, width: WysiwygMediaWidth) {
  embed.style.width = width === 'full' ? '100%' : '';
}

export function $createWysiwygImageNode(
  src: string,
  alt = '',
  width: WysiwygMediaWidth = null,
): WysiwygImageNode {
  return $applyNodeReplacement(new WysiwygImageNode(src, alt, width));
}

export function $isWysiwygImageNode(
  node: LexicalNode | null | undefined,
): node is WysiwygImageNode {
  return node instanceof WysiwygImageNode;
}
