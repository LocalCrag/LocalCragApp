import { type DOMConversionOutput, ElementNode, $isTextNode } from 'lexical';

/**
 * Registered only so pasted and stored `<span style="color: …">` keeps its
 * text color. Lexical's built-in span importer reads bold and italic, not color.
 */
export class WysiwygTextStyleNode extends ElementNode {
  override $config() {
    return this.config('wysiwyg-text-style', {
      extends: ElementNode,
      importDOM: {
        span: () => ({
          conversion: $convertColorSpan,
          priority: 1 as const,
        }),
      },
    });
  }

  override createDOM(): HTMLElement {
    return document.createElement('span');
  }

  override updateDOM(): boolean {
    return false;
  }
}

function $convertColorSpan(domNode: HTMLElement): DOMConversionOutput {
  const color = domNode.style.color;
  const weight = domNode.style.fontWeight;
  const italic = domNode.style.fontStyle === 'italic';
  const underline = domNode.style.textDecoration.includes('underline');
  return {
    forChild: (lexicalNode) => {
      if (!$isTextNode(lexicalNode)) {
        return lexicalNode;
      }
      if (
        (weight === 'bold' || weight === '700') &&
        !lexicalNode.hasFormat('bold')
      ) {
        lexicalNode.toggleFormat('bold');
      }
      if (italic && !lexicalNode.hasFormat('italic')) {
        lexicalNode.toggleFormat('italic');
      }
      if (underline && !lexicalNode.hasFormat('underline')) {
        lexicalNode.toggleFormat('underline');
      }
      if (color) {
        const current = lexicalNode.getStyle();
        lexicalNode.setStyle(
          current
            ? `${current.replace(/;?\s*$/, '')}; color: ${color}`
            : `color: ${color}`,
        );
      }
      return lexicalNode;
    },
    node: null,
  };
}
