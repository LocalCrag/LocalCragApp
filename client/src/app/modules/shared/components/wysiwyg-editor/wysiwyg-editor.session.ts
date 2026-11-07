import { $generateHtmlFromNodes, $generateNodesFromDOM } from '@lexical/html';
import { LinkNode, TOGGLE_LINK_COMMAND, $toggleLink } from '@lexical/link';
import { ListItemNode, ListNode, registerList } from '@lexical/list';
import { registerRichText, QuoteNode } from '@lexical/rich-text';
import { createEmptyHistoryState, registerHistory } from '@lexical/history';
import { mergeRegister } from '@lexical/utils';
import {
  $createParagraphNode,
  $getRoot,
  $isElementNode,
  COMMAND_PRIORITY_EDITOR,
  createEditor,
  TextNode,
  type LexicalEditor,
} from 'lexical';
import { normalizeWysiwygOutput } from './wysiwyg-html';
import {
  stripDisallowedTextStyle,
  stripFontSizeAndHeadings,
} from './wysiwyg-paste';
import { WysiwygImageNode } from './wysiwyg-image.node';
import { WysiwygTextStyleNode } from './wysiwyg-text-style.node';
import { WysiwygVideoNode } from './wysiwyg-video.node';

export function createWysiwygEditor(): LexicalEditor {
  return createEditor({
    namespace: 'LcWysiwyg',
    nodes: [
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode,
      WysiwygImageNode,
      WysiwygVideoNode,
      WysiwygTextStyleNode,
    ],
    onError: (error) => {
      console.error(error);
    },
    theme: {
      link: 'lc-wysiwyg-link',
      list: {
        listitem: 'lc-wysiwyg-li',
        ol: 'lc-wysiwyg-ol',
        ul: 'lc-wysiwyg-ul',
      },
      text: {
        bold: 'lc-wysiwyg-bold',
        italic: 'lc-wysiwyg-italic',
        underline: 'lc-wysiwyg-underline',
      },
    },
  });
}

export function registerWysiwygEditor(editor: LexicalEditor): () => void {
  return mergeRegister(
    registerRichText(editor),
    registerList(editor),
    registerHistory(editor, createEmptyHistoryState(), 300),
    editor.registerCommand(
      TOGGLE_LINK_COMMAND,
      (payload) => {
        $toggleLink(payload);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    ),
    editor.registerNodeTransform(TextNode, (node) => {
      const style = node.getStyle();
      if (!style) {
        return;
      }
      const next = stripDisallowedTextStyle(style);
      if (next !== style) {
        node.setStyle(next);
      }
    }),
  );
}

export function readWysiwygHtml(editor: LexicalEditor): string {
  let html = '';
  editor.read(() => {
    html = normalizeWysiwygOutput($generateHtmlFromNodes(editor));
  });
  return html;
}

export function writeWysiwygHtml(editor: LexicalEditor, html: string): void {
  const prepared = stripFontSizeAndHeadings(html || '');
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
      if (!prepared.trim()) {
        root.append($createParagraphNode());
        return;
      }
      const dom = new DOMParser().parseFromString(prepared, 'text/html');
      const nodes = $generateNodesFromDOM(editor, dom);
      const blocks = groupTopLevelNodes(nodes);
      root.append(...(blocks.length > 0 ? blocks : [$createParagraphNode()]));
    },
    { discrete: true, tag: 'external' },
  );
}

function groupTopLevelNodes(nodes: ReturnType<typeof $generateNodesFromDOM>) {
  const blocks = [];
  let paragraph = null;
  for (const node of nodes) {
    if ($isElementNode(node) && !node.isInline()) {
      paragraph = null;
      blocks.push(node);
      continue;
    }
    if (!paragraph) {
      paragraph = $createParagraphNode();
      blocks.push(paragraph);
    }
    paragraph.append(node);
  }
  return blocks;
}
