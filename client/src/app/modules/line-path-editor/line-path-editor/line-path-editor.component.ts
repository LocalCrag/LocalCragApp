import {
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TopoImage } from '../../../models/topo-image';
import { LinePath } from '../../../models/line-path';
import { Line } from '../../../models/line';
import { TopoImageEditorComponent } from '../../shared/components/topo-image/topo-image-editor.component';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { MenuItem } from 'primeng/api';
import { ContextMenu } from 'primeng/contextmenu';
import { Button } from 'primeng/button';

/**
 * Interactive canvas for drawing and editing a single line path on a topo image.
 * Implements ControlValueAccessor so the path coordinates can be bound to a form control.
 */
@Component({
  selector: 'lc-line-path-editor',
  templateUrl: './line-path-editor.component.html',
  styleUrls: ['./line-path-editor.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LinePathEditorComponent),
      multi: true,
    },
  ],
  encapsulation: ViewEncapsulation.None,
  imports: [TranslocoDirective, TopoImageEditorComponent, Button, ContextMenu],
})
export class LinePathEditorComponent
  implements ControlValueAccessor, OnInit, OnChanges
{
  @ViewChild(TopoImageEditorComponent)
  topoImageComponent: TopoImageEditorComponent;
  @ViewChild('anchorMenu') anchorMenu: ContextMenu;

  @Input() color?: string;
  @Input() topoImage: TopoImage;
  @Input() selectedLine?: Line;

  public linePath: LinePath;
  public isDisabled = false;
  public anchorMenuItems: MenuItem[] = [];

  private cdr = inject(ChangeDetectorRef);
  private translocoService = inject(TranslocoService);
  private onChange: (value: number[]) => void;
  private pendingAnchorIndex: number;

  /**
   * Initializes the anchor context menu and local editor state.
   */
  ngOnInit() {
    this.anchorMenuItems = [
      {
        label: this.translocoService.translate('linePathEditor.deleteAnchor'),
        icon: 'pi pi-trash',
        command: () => this.handleAnchorDelete(this.pendingAnchorIndex),
      },
    ];
    this.refreshData();
  }

  /**
   * Rebuilds editor state when the topo image or selected line changes.
   * @param changes Angular input changes.
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes['topoImage'] && changes['topoImage'].firstChange) {
      this.refreshData(true);
    }
    if (changes['selectedLine'] && this.linePath) {
      this.linePath.line = this.selectedLine;
    }
  }

  /**
   * Resets the in-progress line path while optionally forcing the topo image to re-render.
   * @param clear When true, briefly unmounts the topo image to work around sizing race conditions.
   */
  refreshData(clear = false) {
    const topoImageCache = this.topoImage;
    const pathCache = this.linePath?.path ? [...this.linePath.path] : [];
    if (clear) {
      this.topoImage = null;
      this.cdr.detectChanges();
    }
    this.topoImage = topoImageCache;
    this.cdr.detectChanges();
    this.linePath = new LinePath();
    this.linePath.path = pathCache;
    this.linePath.line = this.selectedLine;
  }

  /**
   * Appends a new anchor at the clicked image position.
   * @param point Absolute click coordinates on the topo canvas.
   */
  handleClick(point: number[]) {
    if (!this.isDisabled) {
      this.linePath.path.push((point[0] / this.topoImageComponent.width) * 100);
      this.linePath.path.push(
        (point[1] / this.topoImageComponent.height) * 100,
      );
      this.topoImageComponent.redrawLinePathInProgress();
      this.onChange(this.linePath.path);
    }
  }

  /**
   * Inserts a new anchor on the clicked segment of the active line path.
   * @param event Segment hit with projected point and insertion index.
   */
  handleLineSegmentClick(event: { point: number[]; insertAfterIndex: number }) {
    if (this.isDisabled) {
      return;
    }
    const insertAt = (event.insertAfterIndex + 1) * 2;
    this.linePath.path.splice(
      insertAt,
      0,
      (event.point[0] / this.topoImageComponent.width) * 100,
      (event.point[1] / this.topoImageComponent.height) * 100,
    );
    this.topoImageComponent.redrawLinePathInProgress();
    this.onChange(this.linePath.path);
  }

  /**
   * Moves an anchor to a new position, or merges it with another anchor on the same line.
   * @param event Drag result with anchor index, new point, and optional merge target.
   */
  handleAnchorDrag(event: {
    index: number;
    point: number[];
    mergeWithIndex?: number;
  }) {
    if (this.isDisabled) {
      return;
    }
    if (event.mergeWithIndex != null && this.linePath.path.length > 4) {
      // Merge into the other same-line anchor by removing the dragged one.
      this.linePath.path.splice(event.index * 2, 2);
    } else {
      this.linePath.path[event.index * 2] =
        (event.point[0] / this.topoImageComponent.width) * 100;
      this.linePath.path[event.index * 2 + 1] =
        (event.point[1] / this.topoImageComponent.height) * 100;
    }
    this.topoImageComponent.redrawLinePathInProgress();
    this.onChange(this.linePath.path);
  }

  /**
   * Opens the anchor delete context menu when the path has more than two anchors.
   * @param event Anchor index and originating pointer event.
   */
  handleAnchorContextMenu(event: { index: number; originalEvent: MouseEvent }) {
    if (this.isDisabled || this.linePath.path.length <= 4) {
      return;
    }
    this.pendingAnchorIndex = event.index;
    this.anchorMenu.show(event.originalEvent);
  }

  /**
   * Removes an anchor from the active line path.
   * @param index Zero-based anchor index.
   */
  handleAnchorDelete(index: number) {
    if (!this.isDisabled && this.linePath.path.length > 4) {
      this.linePath.path.splice(index * 2, 2);
      this.topoImageComponent.redrawLinePathInProgress();
      this.onChange(this.linePath.path);
    }
  }

  /**
   * Registers the form control value change callback.
   * @param fn Callback invoked when the path changes.
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registers the form control touched callback.
   */
  registerOnTouched(_fn: any): void {}

  /**
   * Enables or disables path editing.
   * @param isDisabled Whether user interaction should be blocked.
   */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  /**
   * Writes the current path value from the parent form control.
   * @param value Relative path coordinates, or null/undefined for an empty path.
   */
  writeValue(value: number[]): void {
    if (!this.linePath) {
      this.linePath = new LinePath();
    }
    this.linePath.path = value ?? [];
    this.linePath.line = this.selectedLine;
    if (this.topoImageComponent) {
      this.topoImageComponent.redrawLinePathInProgress();
    }
  }

  /**
   * Removes the last anchor from the active line path.
   */
  undo() {
    if (this.linePath.path.length >= 2) {
      this.linePath.path.pop();
      this.linePath.path.pop();
      this.topoImageComponent.redrawLinePathInProgress();
      this.onChange(this.linePath.path);
    }
  }

  /**
   * Clears all anchors from the active line path.
   */
  restart() {
    this.linePath.path = [];
    this.topoImageComponent.redrawLinePathInProgress();
    this.onChange(this.linePath.path);
  }
}
