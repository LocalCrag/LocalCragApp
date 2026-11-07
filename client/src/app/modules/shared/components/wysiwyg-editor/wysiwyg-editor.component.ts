import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ControlValueAccessor,
  FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
} from '@angular/forms';
import { $insertGeneratedNodes } from '@lexical/clipboard';
import { $generateNodesFromDOM } from '@lexical/html';
import { $isLinkNode, $toggleLink } from '@lexical/link';
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list';
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from '@lexical/selection';
import { $findMatchingParent } from '@lexical/utils';
import { TranslocoPipe, TranslocoService } from '@jsverse/transloco';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import { Tooltip } from 'primeng/tooltip';
import { Dialog } from 'primeng/dialog';
import { Button } from 'primeng/button';
import { InputText } from 'primeng/inputtext';
import { Menu } from 'primeng/menu';
import { ContextMenu } from 'primeng/contextmenu';
import { SelectButton } from 'primeng/selectbutton';
import { FormDirective } from '../../forms/form.directive';
import { ControlGroupDirective } from '../../forms/control-group.directive';
import { FormControlDirective } from '../../forms/form-control.directive';
import { IfErrorDirective } from '../../forms/if-error.directive';
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  $isTextNode,
  $setSelection,
  COMMAND_PRIORITY_HIGH,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  PASTE_COMMAND,
  PASTE_TAG,
  type ElementFormatType,
  type LexicalEditor,
  type LexicalNode,
} from 'lexical';
import { selectInstanceSettingsState } from '../../../../ngrx/selectors/instance-settings.selectors';
import { UploadService } from '../../../../services/crud/upload.service';
import { providerForUrl } from '../../../../utility/video-source';
import { externalVideoUrlValidator } from '../../../../utility/validators/external-video-url.validator';
import { safeMediaUrl, type WysiwygMediaWidth } from './wysiwyg-html';
import {
  $createWysiwygImageNode,
  $isWysiwygImageNode,
} from './wysiwyg-image.node';
import {
  createWysiwygEditor,
  readWysiwygHtml,
  registerWysiwygEditor,
  writeWysiwygHtml,
} from './wysiwyg-editor.session';
import { sanitizePastedHtml } from './wysiwyg-paste';
import { videoNodeForUrl } from './wysiwyg-video-url';
import { $isWysiwygVideoNode } from './wysiwyg-video.node';

export type WysiwygToolbar = 'basic' | 'rich' | 'rich-no-video';

type ResizeCorner = 'nw' | 'ne' | 'sw' | 'se';

interface MediaChrome {
  top: number;
  right: number;
  bottom: number;
  left: number;
  image: boolean;
  resizable: boolean;
}

@Component({
  selector: 'lc-wysiwyg-editor',
  templateUrl: './wysiwyg-editor.component.html',
  styleUrl: './wysiwyg-editor.component.scss',
  host: { class: 'lc-wysiwyg-editor' },
  imports: [
    TranslocoPipe,
    ReactiveFormsModule,
    Tooltip,
    Dialog,
    Button,
    InputText,
    Menu,
    ContextMenu,
    SelectButton,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => WysiwygEditorComponent),
      multi: true,
    },
  ],
})
export class WysiwygEditorComponent
  implements ControlValueAccessor, OnInit, AfterViewInit, OnChanges, OnDestroy
{
  @Input() placeholder = '';
  @Input() height = '200px';
  @Input() readonly = false;
  @Input() toolbar: WysiwygToolbar = 'rich';

  @ViewChild('editorRoot') editorRoot: ElementRef<HTMLDivElement>;
  @ViewChild('surface') surface: ElementRef<HTMLDivElement>;
  @ViewChild(FormDirective) dialogForm: FormDirective;
  @ViewChild('mediaMenu') mediaMenu?: ContextMenu;

  readonly linkForm = new FormGroup({
    url: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, wysiwygLinkValidator],
    }),
  });
  readonly videoForm = new FormGroup({
    url: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, externalVideoUrlValidator()],
    }),
  });
  readonly sizeForm = new FormGroup({
    mode: new FormControl<'full' | 'px'>('full', { nonNullable: true }),
    width: new FormControl<number | string | null>(null, {
      validators: [wysiwygPixelWidthValidator],
    }),
  });

  editorId: string | null = null;
  editable = true;
  showPlaceholder = true;
  uploading = false;
  videoUploadsEnabled = false;
  panel: 'link' | 'video' | 'size' | null = null;
  videoSource: 'link' | 'upload' | null = null;
  videoMenuItems: MenuItem[] = [];
  mediaMenuItems: MenuItem[] = [];
  sizeModeOptions: { label: string; value: 'full' | 'px' }[] = [];
  bold = false;
  italic = false;
  underline = false;
  linkActive = false;
  canRemoveLink = false;
  color = '';
  chrome: MediaChrome | null = null;
  readonly resizeCorners: ResizeCorner[] = ['nw', 'ne', 'sw', 'se'];

  private editor: LexicalEditor;
  private mounted = false;
  private disabled = false;
  private lastHtml = '';
  private queuedHtml: string | null = null;
  private selectedMediaKey: string | null = null;
  private sizeTargetKey: string | null = null;
  private unregister: () => void = () => {};
  private resizeDrag: {
    startX: number;
    startY: number;
    startWidth: number;
    width: number;
    corner: ResizeCorner;
  } | null = null;
  private positionFrame = 0;

  private host = inject(ElementRef<HTMLElement>);
  private uploadService = inject(UploadService);
  private store = inject(Store);
  private transloco = inject(TranslocoService);
  private destroyRef = inject(DestroyRef);
  private ngZone = inject(NgZone);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};
  private onPointerMove = (event: PointerEvent) => this.resizeMove(event);
  private onPointerUp = () => this.resizeEnd();

  ngOnInit() {
    const host = this.host.nativeElement;
    this.editorId = host.id || null;
    if (this.editorId) {
      host.removeAttribute('id');
    }
    this.refreshVideoMenu();
    this.refreshSizeMenu();
    this.sizeForm.controls.mode.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.sizeForm.controls.width.updateValueAndValidity());
    this.transloco.langChanges$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.refreshVideoMenu();
        this.refreshSizeMenu();
      });
    this.store
      .select(selectInstanceSettingsState)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((settings) => {
        this.videoUploadsEnabled = settings.videoUploadsEnabled === true;
      });
  }

  ngAfterViewInit() {
    this.editor = createWysiwygEditor();
    this.unregister = registerWysiwygEditor(this.editor);
    this.unregister = chain(
      this.unregister,
      this.editor.registerCommand(
        PASTE_COMMAND,
        (event) => this.onPaste(event),
        COMMAND_PRIORITY_HIGH,
      ),
    );
    this.editor.setRootElement(this.editorRoot.nativeElement);
    this.mounted = true;
    this.syncEditable();
    writeWysiwygHtml(this.editor, this.queuedHtml ?? this.lastHtml);
    const removeUpdateListener = this.editor.registerUpdateListener(
      ({ tags }) => {
        this.ngZone.run(() => {
          this.refreshChrome();
          if (tags.has('external')) {
            return;
          }
          const html = readWysiwygHtml(this.editor);
          if (html !== this.lastHtml) {
            this.lastHtml = html;
            this.onChange(html);
          }
        });
      },
    );
    this.unregister = chain(this.unregister, () => {
      removeUpdateListener();
      this.editor.setRootElement(null);
    });
    document.addEventListener(
      'selectionchange',
      this.onDocumentSelectionChange,
    );
    this.surface.nativeElement.addEventListener('scroll', this.onSurfaceScroll);
    this.refreshChrome();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['readonly']) {
      this.syncEditable();
    }
  }

  ngOnDestroy() {
    this.mounted = false;
    cancelAnimationFrame(this.positionFrame);
    this.surface?.nativeElement.removeEventListener(
      'scroll',
      this.onSurfaceScroll,
    );
    document.removeEventListener(
      'selectionchange',
      this.onDocumentSelectionChange,
    );
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    this.unregister();
  }

  writeValue(value: string | null): void {
    const next = value ?? '';
    if (next === this.lastHtml && this.mounted) {
      return;
    }
    this.lastHtml = next;
    if (!this.mounted) {
      this.queuedHtml = next;
      return;
    }
    writeWysiwygHtml(this.editor, next);
    this.refreshChrome();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.syncEditable();
  }

  get lists(): boolean {
    return this.toolbar !== 'basic';
  }

  get images(): boolean {
    return this.toolbar !== 'basic';
  }

  get videos(): boolean {
    return this.toolbar === 'rich';
  }

  markTouched() {
    this.onTouched();
  }

  formatText(format: 'bold' | 'italic' | 'underline') {
    this.editor.focus();
    this.editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  }

  formatAlign(format: ElementFormatType) {
    this.editor.focus();
    this.editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, format);
  }

  private onPaste(event: Event): boolean {
    if (!(event instanceof ClipboardEvent)) {
      return false;
    }
    const html = event.clipboardData?.getData('text/html');
    if (!html) {
      return false;
    }
    event.preventDefault();
    const sanitized = sanitizePastedHtml(html, {
      lists: this.lists,
      images: this.images,
      videos: this.videos,
    });
    this.editor.update(
      () => {
        const selection = $getSelection();
        if (!selection || !sanitized) {
          return;
        }
        const dom = new DOMParser().parseFromString(sanitized, 'text/html');
        const nodes = $generateNodesFromDOM(this.editor, dom);
        if (nodes.length > 0) {
          $insertGeneratedNodes(this.editor, nodes, selection);
        }
      },
      { tag: PASTE_TAG },
    );
    return true;
  }

  insertList(ordered: boolean) {
    this.editor.focus();
    this.editor.dispatchCommand(
      ordered ? INSERT_ORDERED_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
      undefined,
    );
  }

  setColor(color: string | null) {
    this.editor.focus();
    this.editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $patchStyleText(selection, { color });
      }
    });
  }

  togglePanel(panel: 'link' | 'video' | 'size') {
    if (this.panel === panel) {
      this.closePanel(panel);
      return;
    }
    this.panel = panel;
    this.videoSource = null;
    if (panel === 'link') {
      this.canRemoveLink = this.selectionHasLink();
      this.linkForm.reset({ url: this.currentLinkUrl() });
    }
  }

  openVideoMenu(event: Event, menu: Menu) {
    menu.toggle(event);
  }

  openVideo(source: 'link' | 'upload') {
    this.videoSource = source;
    if (source === 'link') {
      this.videoForm.reset({ url: '' });
    }
    this.panel = 'video';
  }

  closePanel(panel: 'link' | 'video' | 'size') {
    if (this.panel === panel) {
      this.panel = null;
      this.videoSource = null;
      this.refreshChrome();
    }
  }

  applyLink() {
    if (this.linkForm.invalid) {
      this.dialogForm.markAsTouched();
      return;
    }
    const raw = this.linkForm.controls.url.value;
    const url = linkUrl(raw);
    if (!url) {
      return;
    }
    const label = raw.trim();
    this.editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection) && selection.isCollapsed()) {
        selection.insertText(label);
      }
      $toggleLink(url);
    });
    this.panel = null;
  }

  removeLink() {
    if (!this.canRemoveLink) {
      return;
    }
    this.editor.update(() => {
      $toggleLink(null);
    });
    this.panel = null;
  }

  insertVideo() {
    if (this.videoForm.invalid) {
      this.dialogForm.markAsTouched();
      return;
    }
    const url = this.videoForm.controls.url.value.trim();
    if (!providerForUrl(url)) {
      return;
    }
    this.editor.update(() => {
      const node = videoNodeForUrl(url);
      if (node) {
        insertInline(node);
      }
    });
    this.panel = null;
  }

  openFilePicker(input: HTMLInputElement) {
    input.click();
  }

  onImageSelected(event: Event) {
    this.uploadMedia(event, (uploaded) => {
      const src = safeMediaUrl(uploaded.thumbnailXL || uploaded.path);
      if (!src) {
        return;
      }
      this.editor.update(() => {
        insertInline(
          $createWysiwygImageNode(src, uploaded.originalFilename || ''),
        );
      });
    });
  }

  onVideoSelected(event: Event) {
    this.uploadMedia(event, (uploaded) => {
      const src = safeMediaUrl(uploaded.path);
      if (!src) {
        return;
      }
      this.editor.update(() => {
        const node = videoNodeForUrl(src);
        if (node) {
          insertInline(node);
        }
      });
    });
  }

  private readonly onSurfaceScroll = () => this.scheduleChromePosition();

  private readonly onDocumentSelectionChange = () => {
    this.ngZone.run(() => this.refreshChrome());
    queueMicrotask(() => this.alignSelectionWithDomLink());
  };

  @HostListener('click', ['$event'])
  onSurfaceClick(event: MouseEvent) {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }
    const anchor = target.closest('a');
    if (
      anchor &&
      this.editorRoot?.nativeElement.contains(anchor) &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.altKey
    ) {
      event.preventDefault();
    }
    const embed = target.closest('[data-wysiwyg-key]');
    if (!(embed instanceof HTMLElement) || !this.editable) {
      return;
    }
    const key = embed.getAttribute('data-wysiwyg-key');
    if (!key) {
      return;
    }
    this.selectMedia(key);
  }

  private selectMedia(key: string) {
    this.editor.update(() => {
      const node = $getNodeByKey(key);
      if (!$isWysiwygImageNode(node) && !$isWysiwygVideoNode(node)) {
        return;
      }
      const selection = $createNodeSelection();
      selection.add(key);
      $setSelection(selection);
    });
  }

  private mediaWidth(key: string): WysiwygMediaWidth {
    let width: WysiwygMediaWidth = null;
    this.editor.read(() => {
      const node = $getNodeByKey(key);
      if ($isWysiwygImageNode(node) || $isWysiwygVideoNode(node)) {
        width = node.getWidth();
      }
    });
    return width;
  }

  private mediaElement(key: string): HTMLElement | null {
    const media = this.editor
      ?.getElementByKey(key)
      ?.querySelector('img, iframe, video');
    return media instanceof HTMLElement ? media : null;
  }

  onMediaContextMenu(event: MouseEvent) {
    if (!this.editable) {
      return;
    }
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const embed = target.closest('[data-wysiwyg-key]');
    if (
      !(embed instanceof HTMLElement) ||
      !embed.querySelector('img, iframe, video')
    ) {
      return;
    }
    const key = embed.getAttribute('data-wysiwyg-key');
    if (!key) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    this.sizeTargetKey = key;
    this.selectMedia(key);
    this.mediaMenu?.show(event);
  }

  openSizeDialog() {
    const key = this.sizeTargetKey;
    if (!key) {
      return;
    }
    const stored = this.mediaWidth(key);
    const rendered = Math.max(
      48,
      Math.round(this.mediaElement(key)?.getBoundingClientRect().width || 48),
    );
    this.sizeForm.reset({
      mode: stored === 'full' ? 'full' : 'px',
      width: typeof stored === 'number' ? stored : rendered,
    });
    this.panel = 'size';
  }

  applySize() {
    this.sizeForm.controls.width.updateValueAndValidity();
    if (this.sizeForm.invalid) {
      this.dialogForm?.markAsTouched();
      return;
    }
    const key = this.sizeTargetKey;
    if (!key) {
      return;
    }
    const width: WysiwygMediaWidth =
      this.sizeForm.controls.mode.value === 'full'
        ? 'full'
        : Math.round(Number(this.sizeForm.controls.width.value));
    this.editor.update(() => {
      const node = $getNodeByKey(key);
      if ($isWysiwygImageNode(node) || $isWysiwygVideoNode(node)) {
        node.setWidth(width);
      }
    });
    this.panel = null;
  }

  deleteSelected() {
    const key = this.selectedMediaKey;
    if (!key) {
      return;
    }
    this.editor.update(() => {
      $getNodeByKey(key)?.remove();
    });
  }

  startResize(event: PointerEvent, corner: ResizeCorner) {
    if (!this.selectedMediaKey) {
      return;
    }
    const media = this.selectedMediaElement();
    if (!media) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    const width = media.getBoundingClientRect().width;
    this.resizeDrag = {
      startX: event.clientX,
      startY: event.clientY,
      startWidth: width,
      width,
      corner,
    };
    document.addEventListener('pointermove', this.onPointerMove);
    document.addEventListener('pointerup', this.onPointerUp);
  }

  private uploadMedia(
    event: Event,
    insert: (file: {
      thumbnailXL?: string;
      path: string;
      originalFilename?: string;
    }) => void,
  ) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.uploading = true;
    this.uploadService.uploadFile(file).subscribe({
      next: (uploaded) => {
        this.uploading = false;
        insert(uploaded);
      },
      error: () => {
        this.uploading = false;
      },
    });
  }

  private domLinkPoint(): { node: Node; offset: number } | null {
    const root = this.editorRoot?.nativeElement;
    const selection = document.getSelection();
    const anchor = selection?.anchorNode;
    if (!root || !selection || !anchor || !root.contains(anchor)) {
      return null;
    }
    const element = anchor instanceof Element ? anchor : anchor.parentElement;
    if (!element?.closest('a')) {
      return null;
    }
    return { node: anchor, offset: selection.anchorOffset };
  }

  private alignSelectionWithDomLink() {
    const point = this.domLinkPoint();
    if (!point || !this.editor || !this.mounted || this.panel) {
      return;
    }
    let alreadyInside = false;
    this.editor.read(() => {
      alreadyInside = !!linkFromSelection($getSelection());
    });
    if (alreadyInside) {
      return;
    }
    this.editor.update(() => {
      if (linkFromSelection($getSelection())) {
        return;
      }
      const nearest = $getNearestNodeFromDOMNode(point.node);
      if (!nearest) {
        return;
      }
      if ($isTextNode(nearest)) {
        const offset = Math.min(point.offset, nearest.getTextContentSize());
        nearest.select(offset, offset);
        return;
      }
      const link = $isLinkNode(nearest)
        ? nearest
        : $findMatchingParent(nearest, $isLinkNode);
      if ($isLinkNode(link)) {
        link.select(0, 0);
      }
    });
  }

  private selectionHasLink(): boolean {
    let found = false;
    this.editor.read(() => {
      found = !!linkFromSelection($getSelection());
    });
    return found;
  }

  private currentLinkUrl(): string {
    let url = '';
    this.editor.read(() => {
      url = linkFromSelection($getSelection())?.getURL() ?? '';
    });
    return url;
  }

  private refreshChrome() {
    if (!this.editor) {
      return;
    }
    this.showPlaceholder = readWysiwygHtml(this.editor) === '';
    this.editor.read(() => {
      const selection = $getSelection();
      this.bold = $isRangeSelection(selection) && selection.hasFormat('bold');
      this.italic =
        $isRangeSelection(selection) && selection.hasFormat('italic');
      this.underline =
        $isRangeSelection(selection) && selection.hasFormat('underline');
      const insideLink =
        !!linkFromSelection(selection) || !!this.domLinkPoint();
      this.linkActive =
        insideLink || (this.panel === 'link' && this.linkActive);
      this.color = $isRangeSelection(selection)
        ? $getSelectionStyleValueForProperty(selection, 'color', '')
        : '';
      this.selectedMediaKey = null;
      const selected = selection ? selection.getNodes()[0] : null;
      if ($isWysiwygImageNode(selected) || $isWysiwygVideoNode(selected)) {
        this.selectedMediaKey = selected.getKey();
      }
    });
    this.scheduleChromePosition();
  }

  scheduleChromePosition() {
    cancelAnimationFrame(this.positionFrame);
    this.positionFrame = requestAnimationFrame(() => this.positionChrome());
  }

  private positionChrome() {
    const key = this.selectedMediaKey;
    const surface = this.surface?.nativeElement;
    const dom = key ? this.editor?.getElementByKey(key) : null;
    surface
      ?.querySelectorAll('.lc-wysiwyg-embed--selected')
      .forEach((element) =>
        element.classList.remove('lc-wysiwyg-embed--selected'),
      );
    if (!dom || !surface) {
      this.chrome = null;
      return;
    }
    dom.classList.add('lc-wysiwyg-embed--selected');
    const media = dom.getBoundingClientRect();
    const box = surface.getBoundingClientRect();
    this.chrome = {
      top: media.top - box.top + surface.scrollTop,
      right: media.right - box.left + surface.scrollLeft,
      bottom: media.bottom - box.top + surface.scrollTop,
      left: media.left - box.left + surface.scrollLeft,
      image: !!dom.querySelector('img'),
      resizable: !!dom.querySelector('img, iframe, video'),
    };
  }

  private selectedMediaElement(): HTMLElement | null {
    const media = this.selectedMediaKey
      ? this.editor
          ?.getElementByKey(this.selectedMediaKey)
          ?.querySelector('img, iframe, video')
      : null;
    return media instanceof HTMLElement ? media : null;
  }

  private resizeMove(event: PointerEvent) {
    if (!this.resizeDrag || !this.selectedMediaKey) {
      return;
    }
    const dx = event.clientX - this.resizeDrag.startX;
    const dy = event.clientY - this.resizeDrag.startY;
    const alongX = this.resizeDrag.corner.endsWith('e') ? dx : -dx;
    const alongY = this.resizeDrag.corner.startsWith('s') ? dy : -dy;
    const delta = Math.abs(alongX) >= Math.abs(alongY) ? alongX : alongY;
    const width = Math.max(48, Math.round(this.resizeDrag.startWidth + delta));
    this.resizeDrag.width = width;
    const media = this.selectedMediaElement();
    if (media) {
      media.style.width = `${width}px`;
    }
    this.positionChrome();
  }

  private resizeEnd() {
    document.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerup', this.onPointerUp);
    const width = this.resizeDrag?.width;
    const key = this.selectedMediaKey;
    this.resizeDrag = null;
    if (!width || !key) {
      return;
    }
    this.editor.update(() => {
      const node = $getNodeByKey(key);
      if ($isWysiwygImageNode(node) || $isWysiwygVideoNode(node)) {
        node.setWidth(width);
      }
    });
  }

  private refreshSizeMenu() {
    this.mediaMenuItems = [
      {
        label: this.transloco.translate('wysiwygEditor.size'),
        icon: 'pi pi-expand',
        command: () => this.ngZone.run(() => this.openSizeDialog()),
      },
    ];
    this.sizeModeOptions = [
      {
        label: this.transloco.translate('wysiwygEditor.fullWidth'),
        value: 'full',
      },
      {
        label: this.transloco.translate('wysiwygEditor.widthPx'),
        value: 'px',
      },
    ];
  }

  private refreshVideoMenu() {
    this.videoMenuItems = [
      {
        label: this.transloco.translate('wysiwygEditor.videoLink'),
        icon: 'pi pi-link',
        command: () => this.ngZone.run(() => this.openVideo('link')),
      },
      {
        label: this.transloco.translate('wysiwygEditor.videoUpload'),
        icon: 'pi pi-upload',
        command: () => this.ngZone.run(() => this.openVideo('upload')),
      },
    ];
  }

  private syncEditable() {
    this.editable = !this.disabled && !this.readonly;
    if (!this.editable) {
      this.panel = null;
      this.videoSource = null;
    }
    this.editor?.setEditable(this.editable);
  }
}

function chain(first: () => void, second: () => void): () => void {
  return () => {
    first();
    second();
  };
}

function linkFromSelection(selection: ReturnType<typeof $getSelection>) {
  if (!$isRangeSelection(selection)) {
    return null;
  }
  const candidates: LexicalNode[] = [
    selection.anchor.getNode(),
    selection.focus.getNode(),
  ];
  if (selection.isCollapsed() && selection.anchor.type === 'element') {
    const parent = selection.anchor.getNode();
    if ($isElementNode(parent)) {
      const child = parent.getChildAtIndex(selection.anchor.offset);
      if (child) {
        candidates.push(child);
      }
    }
  }
  candidates.push(...selection.getNodes());
  for (const node of candidates) {
    if ($isLinkNode(node)) {
      return node;
    }
    const parent = $findMatchingParent(node, $isLinkNode);
    if ($isLinkNode(parent)) {
      return parent;
    }
  }
  return null;
}

function linkUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }
  if (trimmed.includes('@') || trimmed.toLowerCase().startsWith('mailto:')) {
    const mailto = trimmed.toLowerCase().startsWith('mailto:')
      ? trimmed
      : `mailto:${trimmed}`;
    return /^mailto:[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(mailto) ? mailto : null;
  }
  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
  if (!/^https?:\/\//i.test(withScheme)) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return null;
  }
  const typedHost = withScheme
    .replace(/^https?:\/\//i, '')
    .split(/[/?#]/)[0]
    .replace(/:\d+$/, '');
  if (typedHost.toLowerCase() !== url.hostname.toLowerCase()) {
    return null;
  }
  return validLinkHost(url.hostname) ? url.href : null;
}

function validLinkHost(host: string): boolean {
  if (host === 'localhost') {
    return true;
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    return host.split('.').every((part) => Number(part) <= 255);
  }
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(host);
}

function wysiwygPixelWidthValidator(
  control: AbstractControl,
): ValidationErrors | null {
  if (control.parent?.get('mode')?.value !== 'px') {
    return null;
  }
  const raw = control.value;
  if (raw === null || raw === '') {
    return { required: true };
  }
  const width = Number(raw);
  if (!Number.isFinite(width) || width < 48) {
    return { invalidWidth: true };
  }
  return null;
}

function wysiwygLinkValidator(
  control: AbstractControl,
): ValidationErrors | null {
  const value = trimmedControlValue(control);
  if (!value) {
    return { required: true };
  }
  return linkUrl(value) ? null : { invalidUrl: true };
}

function trimmedControlValue(control: AbstractControl): string {
  return typeof control.value === 'string' ? control.value.trim() : '';
}

function insertInline(node: LexicalNode) {
  const selection = $getSelection();
  if ($isRangeSelection(selection)) {
    selection.insertNodes([node]);
    return;
  }
  const root = $getRoot();
  const last = root.getLastChild();
  if ($isElementNode(last)) {
    last.append(node);
    return;
  }
  root.append(node);
}
