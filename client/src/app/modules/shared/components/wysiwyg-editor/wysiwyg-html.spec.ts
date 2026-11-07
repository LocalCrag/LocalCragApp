import { $createTextNode, $getRoot, $createParagraphNode } from 'lexical';
import {
  createWysiwygEditor,
  readWysiwygHtml,
  registerWysiwygEditor,
  writeWysiwygHtml,
} from './wysiwyg-editor.session';
import { sanitizePastedHtml, stripFontSizeAndHeadings } from './wysiwyg-paste';

describe('wysiwyg html', () => {
  it('round-trips stored HTML through Lexical', () => {
    const editor = createWysiwygEditor();
    const root = document.createElement('div');
    document.body.appendChild(root);
    registerWysiwygEditor(editor);
    editor.setRootElement(root);

    writeWysiwygHtml(
      editor,
      [
        '<p style="text-align: center"><strong>Hello</strong></p>',
        '<ul><li>One</li></ul>',
        '<p><img src="https://cdn.example.com/a.jpg" width="240" alt="topo"></p>',
        '<p><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe></p>',
        '<p><span style="color: #e60000">Red</span></p>',
      ].join(''),
    );

    const html = readWysiwygHtml(editor);
    expect(html).toContain('text-align: center');
    expect(html).toContain('Hello');
    expect(html).toContain('<li');
    expect(html).toContain('One');
    expect(html).toContain('https://cdn.example.com/a.jpg');
    expect(html).toContain('240');
    expect(html).toContain('https://www.youtube.com/embed/dQw4w9WgXcQ');
    expect(html).toContain('Hello');
    expect(html).toMatch(/color:\s*(#e60000|rgb\(230,\s*0,\s*0\))/i);

    editor.update(
      () => {
        const paragraph = $createParagraphNode();
        const text = $createTextNode('Direct');
        text.toggleFormat('bold');
        paragraph.append(text);
        $getRoot().clear();
        $getRoot().append(paragraph);
      },
      { discrete: true },
    );
    const formatted = readWysiwygHtml(editor);
    expect(formatted).toContain('Direct');
    expect(formatted).toContain('lc-wysiwyg-bold');

    root.remove();
  });

  it('loads headings as paragraphs and drops font size', () => {
    const editor = createWysiwygEditor();
    const root = document.createElement('div');
    document.body.appendChild(root);
    registerWysiwygEditor(editor);
    editor.setRootElement(root);

    writeWysiwygHtml(
      editor,
      '<h1 style="font-size: 40px; text-align: center">Title</h1><p style="font-size: 12px; color: #e60000">Red</p>',
    );

    const html = readWysiwygHtml(editor);
    expect(html).toContain('Title');
    expect(html).toContain('lc-wysiwyg-bold');
    expect(html).toContain('text-align: center');
    expect(html).not.toMatch(/<h[1-6]/i);
    expect(html).not.toMatch(/font-size/i);
    expect(html).toMatch(/color:\s*(#e60000|rgb\(230,\s*0,\s*0\))/i);

    root.remove();
  });
});

describe('wysiwyg paste', () => {
  const rich = { lists: true, images: true, videos: true };

  it('keeps only markup the editor can produce', () => {
    const html = sanitizePastedHtml(
      [
        '<h1 style="font-size: 40px; text-align: center">Title</h1>',
        '<p><span style="font-size: 12px; color: #ff0000; font-family: Arial; font-weight: bold">Red</span></p>',
        '<table><tr><td>Cell</td></tr></table>',
        '<script>alert(1)</script>',
        '<a href="javascript:alert(1)">bad</a>',
        '<a href="https://example.com/docs">ok</a>',
        '<iframe src="https://example.com/embed"></iframe>',
        '<iframe src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"></iframe>',
        '<ul><li>One</li></ul>',
      ].join(''),
      rich,
    );

    expect(html).not.toMatch(/<h[1-6]/i);
    expect(html).not.toMatch(/font-size|font-family|javascript:|<script/i);
    expect(html).toContain('text-align: center');
    expect(html).toContain('<strong>Title</strong>');
    expect(html).toContain('Red');
    expect(html).toContain('<strong>');
    expect(html).toContain('Cell');
    expect(html).toContain('https://example.com/docs');
    expect(html).not.toContain('https://example.com/embed');
    expect(html).toContain(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
    );
    expect(html).toContain('<ul>');
    expect(html).toContain('One');
  });

  it('drops lists and images when the toolbar cannot create them', () => {
    const html = sanitizePastedHtml(
      '<ul><li>One</li></ul><img alt="Topo" src="https://cdn.example.com/a.jpg">',
      { lists: false, images: false, videos: false },
    );
    expect(html).toContain('One');
    expect(html).toContain('Topo');
    expect(html).not.toMatch(/<ul|<img/i);
  });

  it('leaves stored html unchanged when it has no heading or font size', () => {
    const html = '<p style="text-align: left"><strong>Hello</strong></p>';
    expect(stripFontSizeAndHeadings(html)).toBe(html);
  });
});
