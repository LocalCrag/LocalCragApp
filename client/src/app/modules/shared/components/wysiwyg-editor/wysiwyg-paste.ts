import { providerForUrl, videoEmbed } from '../../../../utility/video-source';
import { imageWidth, safeMediaUrl, writeMediaWidth } from './wysiwyg-html';

/**
 * Markup the toolbar can create. Anything else is dropped or unwrapped on paste.
 */
export interface WysiwygPasteOptions {
  lists: boolean;
  images: boolean;
  videos: boolean;
}

const BLOCK_TAGS = new Set([
  'address',
  'article',
  'blockquote',
  'center',
  'dd',
  'div',
  'dt',
  'figcaption',
  'footer',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'header',
  'li',
  'p',
  'pre',
  'section',
  'td',
  'th',
]);

const DROP_TAGS = new Set([
  'button',
  'canvas',
  'embed',
  'form',
  'head',
  'input',
  'link',
  'math',
  'meta',
  'noscript',
  'object',
  'script',
  'select',
  'style',
  'svg',
  'textarea',
  'title',
]);

const TEXT_STYLE_DENY = new Set([
  'background',
  'background-color',
  'font',
  'font-family',
  'font-size',
  'font-style',
  'font-weight',
  'letter-spacing',
  'line-height',
]);

export function stripFontSizeAndHeadings(html: string): string {
  if (!html || !/font-size\s*:|\bfont\s*:|<h[1-6]\b|<font\b/i.test(html)) {
    return html;
  }
  const doc = new DOMParser().parseFromString(html, 'text/html');
  let changed = false;
  for (const element of [...doc.body.querySelectorAll('*')]) {
    if (!(element instanceof HTMLElement)) {
      continue;
    }
    const tag = element.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const paragraph = doc.createElement('p');
      const strong = doc.createElement('strong');
      strong.append(...element.childNodes);
      if (strong.childNodes.length > 0) {
        paragraph.append(strong);
      }
      for (const attr of [...element.attributes]) {
        paragraph.setAttribute(attr.name, attr.value);
      }
      element.replaceWith(paragraph);
      changed = cleanElementStyle(paragraph) || changed;
      changed = true;
      continue;
    }
    if (tag === 'font' && element.hasAttribute('size')) {
      element.removeAttribute('size');
      changed = true;
      if (element.attributes.length === 0) {
        element.replaceWith(...element.childNodes);
        continue;
      }
    }
    changed = cleanElementStyle(element) || changed;
  }
  return changed ? doc.body.innerHTML : html;
}

export function sanitizePastedHtml(
  html: string,
  options: WysiwygPasteOptions,
): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const builder = new BlockBuilder();
  for (const child of [...doc.body.childNodes]) {
    clean(builder, child, options);
  }
  return builder.blocks.map((block) => block.outerHTML).join('');
}

/** Drop text styles the editor does not write. Color and Lexical's white-space stay. */
export function stripDisallowedTextStyle(style: string): string {
  return stripStyleProperties(style, TEXT_STYLE_DENY);
}

function stripStyleProperties(style: string, denied: Set<string>): string {
  let removed = false;
  const kept: string[] = [];
  for (const part of style.split(';')) {
    const declaration = part.trim();
    if (!declaration || !declaration.includes(':')) {
      continue;
    }
    const name = declaration.split(':')[0].trim().toLowerCase();
    if (denied.has(name)) {
      removed = true;
      continue;
    }
    kept.push(declaration);
  }
  return removed ? kept.join('; ') : style;
}

class BlockBuilder {
  blocks: HTMLElement[] = [];
  private paragraph: HTMLParagraphElement | null = null;

  addInline(node: Node) {
    if (!this.paragraph) {
      this.paragraph = document.createElement('p');
      this.blocks.push(this.paragraph);
    }
    this.paragraph.append(node);
  }

  addBlock(node: HTMLElement) {
    this.paragraph = null;
    this.blocks.push(node);
  }

  hasOpenParagraph(): boolean {
    return this.paragraph !== null;
  }
}

function clean(
  builder: BlockBuilder,
  node: Node,
  options: WysiwygPasteOptions,
) {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? '';
    if (!text || (!text.trim() && !builder.hasOpenParagraph())) {
      return;
    }
    builder.addInline(document.createTextNode(text));
    return;
  }
  if (!(node instanceof HTMLElement)) {
    return;
  }
  const tag = node.tagName.toLowerCase();
  if (DROP_TAGS.has(tag)) {
    return;
  }
  if (tag === 'br') {
    builder.addInline(document.createElement('br'));
    return;
  }
  if (tag === 'img') {
    appendImage(builder, node, options);
    return;
  }
  if (tag === 'iframe' || tag === 'video') {
    appendVideo(builder, node, options);
    return;
  }
  if (tag === 'a') {
    appendLink(builder, node, options);
    return;
  }
  if (tag === 'ul' || tag === 'ol') {
    appendList(builder, node, options);
    return;
  }
  if (tag === 'span' || tag === 'font') {
    appendSpan(builder, node, options);
    return;
  }
  if (
    tag === 'b' ||
    tag === 'strong' ||
    tag === 'i' ||
    tag === 'em' ||
    tag === 'u'
  ) {
    appendFormatting(builder, tag, node, options);
    return;
  }
  if (BLOCK_TAGS.has(tag)) {
    appendBlock(builder, node, options);
    return;
  }
  for (const child of [...node.childNodes]) {
    clean(builder, child, options);
  }
}

function appendBlock(
  builder: BlockBuilder,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  const inner = new BlockBuilder();
  for (const child of [...source.childNodes]) {
    clean(inner, child, options);
  }
  const align = allowedAlign(source);
  const direction = allowedDirection(source);
  const bold = /^h[1-6]$/.test(source.tagName.toLowerCase());
  for (const block of inner.blocks) {
    if (block.tagName === 'P') {
      if (bold) {
        wrapInStrong(block);
      }
      if (align && !block.style.textAlign) {
        block.style.textAlign = align;
      }
      if (direction && !block.hasAttribute('dir')) {
        block.setAttribute('dir', direction);
      }
    }
    builder.addBlock(block);
  }
}

function appendFormatting(
  builder: BlockBuilder,
  tag: string,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  const weight = source.style.fontWeight.toLowerCase();
  if (
    (tag === 'b' || tag === 'strong') &&
    (weight === 'normal' || weight === '400')
  ) {
    appendChildren(builder, source, options);
    return;
  }
  if (
    (tag === 'i' || tag === 'em') &&
    source.style.fontStyle.toLowerCase() === 'normal'
  ) {
    appendChildren(builder, source, options);
    return;
  }
  const element = document.createElement(
    tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag,
  );
  moveInlineChildren(element, source, options);
  if (element.childNodes.length > 0) {
    builder.addInline(element);
  }
}

function appendSpan(
  builder: BlockBuilder,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  const color = source.style.color || source.getAttribute('color') || '';
  const bold = isBoldWeight(source.style.fontWeight);
  const italic = source.style.fontStyle.toLowerCase() === 'italic';
  const underline = /underline/i.test(
    `${source.style.textDecoration} ${source.style.textDecorationLine}`,
  );
  const inner = new BlockBuilder();
  for (const child of [...source.childNodes]) {
    clean(inner, child, options);
  }
  for (const block of inner.blocks) {
    if (block.tagName !== 'P') {
      builder.addBlock(block);
      continue;
    }
    let content: Node[] = [...block.childNodes];
    const wrap = (name: string) => {
      const element = document.createElement(name);
      element.append(...content);
      content = [element];
    };
    if (underline) {
      wrap('u');
    }
    if (italic) {
      wrap('em');
    }
    if (bold) {
      wrap('strong');
    }
    if (color) {
      const span = document.createElement('span');
      span.style.color = color;
      span.append(...content);
      content = [span];
    }
    for (const node of content) {
      builder.addInline(node);
    }
  }
}

function appendLink(
  builder: BlockBuilder,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  const href = allowedHref(source.getAttribute('href'));
  if (!href) {
    appendChildren(builder, source, options);
    return;
  }
  const link = document.createElement('a');
  link.setAttribute('href', href);
  moveInlineChildren(link, source, options);
  if (link.childNodes.length > 0) {
    builder.addInline(link);
  }
}

function appendList(
  builder: BlockBuilder,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  if (!options.lists) {
    appendChildren(builder, source, options);
    return;
  }
  const list = document.createElement(source.tagName.toLowerCase());
  for (const child of [...source.childNodes]) {
    if (!(child instanceof HTMLElement) || child.tagName !== 'LI') {
      continue;
    }
    const item = document.createElement('li');
    const inner = new BlockBuilder();
    for (const grand of [...child.childNodes]) {
      clean(inner, grand, options);
    }
    for (const block of inner.blocks) {
      if (block.tagName === 'UL' || block.tagName === 'OL') {
        item.append(block);
      } else {
        item.append(...block.childNodes);
      }
    }
    if (item.childNodes.length > 0) {
      list.append(item);
    }
  }
  if (list.childNodes.length > 0) {
    builder.addBlock(list);
  }
}

function appendImage(
  builder: BlockBuilder,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  if (!options.images) {
    const alt = source.getAttribute('alt');
    if (alt) {
      builder.addInline(document.createTextNode(alt));
    }
    return;
  }
  const src = safeMediaUrl(source.getAttribute('src'));
  if (!src) {
    return;
  }
  const image = document.createElement('img');
  image.setAttribute('src', src);
  const alt = source.getAttribute('alt');
  if (alt) {
    image.setAttribute('alt', alt);
  }
  writeMediaWidth(image, imageWidth(source));
  builder.addInline(image);
}

function appendVideo(
  builder: BlockBuilder,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  if (!options.videos) {
    return;
  }
  const src = safeMediaUrl(source.getAttribute('src'));
  if (!src) {
    return;
  }
  if (source.tagName === 'IFRAME') {
    if (!providerForUrl(src)) {
      return;
    }
    const embedUrl = videoEmbed({ url: src }).embedUrl;
    if (!embedUrl) {
      return;
    }
    const iframe = document.createElement('iframe');
    iframe.setAttribute('src', embedUrl);
    writeMediaWidth(iframe, imageWidth(source));
    builder.addInline(iframe);
    return;
  }
  const video = document.createElement('video');
  video.setAttribute('src', src);
  writeMediaWidth(video, imageWidth(source));
  builder.addInline(video);
}

function appendChildren(
  builder: BlockBuilder,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  for (const child of [...source.childNodes]) {
    clean(builder, child, options);
  }
}

function moveInlineChildren(
  target: HTMLElement,
  source: HTMLElement,
  options: WysiwygPasteOptions,
) {
  const inner = new BlockBuilder();
  for (const child of [...source.childNodes]) {
    clean(inner, child, options);
  }
  for (const block of inner.blocks) {
    if (block.tagName === 'P') {
      target.append(...block.childNodes);
    }
  }
}

function wrapInStrong(element: HTMLElement) {
  if (element.childNodes.length === 0) {
    return;
  }
  const strong = document.createElement('strong');
  strong.append(...element.childNodes);
  element.append(strong);
}

function cleanElementStyle(element: HTMLElement): boolean {
  const style = element.getAttribute('style');
  if (!style) {
    return false;
  }
  const next = stripStyleProperties(style, new Set(['font', 'font-size']));
  if (next === style) {
    return false;
  }
  if (!next) {
    element.removeAttribute('style');
  } else {
    element.setAttribute('style', next);
  }
  return true;
}

function allowedAlign(element: HTMLElement): string | null {
  const value = (
    element.style.textAlign ||
    element.getAttribute('align') ||
    ''
  ).toLowerCase();
  return value === 'left' ||
    value === 'center' ||
    value === 'right' ||
    value === 'justify'
    ? value
    : null;
}

function allowedDirection(element: HTMLElement): string | null {
  const value = (element.getAttribute('dir') || '').toLowerCase();
  return value === 'ltr' || value === 'rtl' ? value : null;
}

function allowedHref(value: string | null): string | null {
  const trimmed = value?.trim() ?? '';
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }
  if (/^mailto:/i.test(trimmed)) {
    return /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(trimmed)
      ? trimmed
      : null;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return null;
  }
  try {
    const url = new URL(trimmed);
    return url.protocol === 'http:' || url.protocol === 'https:'
      ? url.href
      : null;
  } catch {
    return null;
  }
}

function isBoldWeight(weight: string): boolean {
  const normalized = weight.toLowerCase();
  if (normalized === 'bold') {
    return true;
  }
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric >= 600;
}
