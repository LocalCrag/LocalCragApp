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
import { TopoImageComponent } from '../../shared/components/topo-image/topo-image.component';
import { TranslocoDirective } from '@jsverse/transloco';

import { Button } from 'primeng/button';

/**
 * Form component for drawing a line path.
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
  imports: [TranslocoDirective, TopoImageComponent, Button],
})
export class LinePathEditorComponent
  implements ControlValueAccessor, OnInit, OnChanges
{
  @ViewChild(TopoImageComponent) topoImageComponent: TopoImageComponent;

  @Input() color?: string; // Line color for currently drawn line
  @Input() topoImage: TopoImage;

  public linePath: LinePath;
  public isDisabled = false;

  private cdr = inject(ChangeDetectorRef);

  private onChange: (value: number[]) => void;

  /**
   * Loads the topo image on which to draw the line.
   */
  ngOnInit() {
    this.refreshData();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['topoImage']) {
      this.refreshData(true);
    }
  }

  /**
   * Loads new data.
   *
   * @param clear If true, the old topo image component is destroyed.
   */
  refreshData(clear = false) {
    const topoImageCache = this.topoImage;
    if (clear) {
      this.topoImage = null;
      this.cdr.detectChanges();
    }
    this.topoImage = topoImageCache;
    this.cdr.detectChanges();
    this.linePath = new LinePath();
  }

  /**
   * Adds a new point to the path on click.
   * @param point Point to add.
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
   * Registers the onChange function in the ControlValueAccessor.
   * @param fn onChange function.
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * Registers the onTouched function in the ControlValueAccessor.
   * @param fn onTouched function.
   */
  registerOnTouched(_fn: any): void {}

  /**
   * Sets the disabled state.
   * @param isDisabled True if component should be disabled.
   */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  /**
   * Writes a new value to the model.
   * @param value Value to write to the model.
   */
  writeValue(value: number[]): void {
    this.linePath.path = value;
  }

  undo() {
    this.linePath.path.pop();
    this.linePath.path.pop();
    this.topoImageComponent.redrawLinePathInProgress();
    this.onChange(this.linePath.path);
  }

  restart() {
    this.linePath.path = [];
    this.topoImageComponent.redrawLinePathInProgress();
    this.onChange(this.linePath.path);
  }
}
