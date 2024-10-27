import {
  ChangeDetectorRef,
  Component,
  forwardRef, Input,
  OnInit,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { TopoImagesService } from '../../../services/crud/topo-images.service';
import { ActivatedRoute } from '@angular/router';
import { TopoImage } from '../../../models/topo-image';
import { LinePath } from '../../../models/line-path';
import { TopoImageComponent } from '../../shared/components/topo-image/topo-image.component';

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
})
export class LinePathEditorComponent implements ControlValueAccessor, OnInit {
  @ViewChild(TopoImageComponent) topoImageComponent: TopoImageComponent;

  @Input() color?: string; // Line color for currently drawn line

  public topoImage: TopoImage;
  public linePath: LinePath;
  public isDisabled = false;

  private topoImageId: string = null;
  private onChange: (value: number[]) => void;

  constructor(
    private topoImagesService: TopoImagesService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  /**
   * Loads the topo image on which to draw the line.
   */
  ngOnInit() {
    this.topoImageId = this.route.snapshot.paramMap.get('topo-image-id');
    this.refreshData();
  }

  /**
   * Loads new data.
   *
   * @param clear If true, the old topo image component is destroyed.
   */
  refreshData(clear = false) {
    if (clear) {
      this.topoImage = null;
      this.cdr.detectChanges();
    }
    this.topoImagesService
      .getTopoImage(this.topoImageId)
      .subscribe((topoImage) => {
        this.topoImage = topoImage;
        this.cdr.detectChanges();
      });
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
