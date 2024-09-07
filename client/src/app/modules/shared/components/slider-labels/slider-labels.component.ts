import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnChanges,
  Renderer2,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {TranslocoPipe} from '@jsverse/transloco';

@Component({
  selector: 'lc-slider-labels',
  standalone: true,
  imports: [
    TranslocoPipe
  ],
  templateUrl: './slider-labels.component.html',
  styleUrl: './slider-labels.component.scss'
})
export class SliderLabelsComponent implements OnChanges {

  @Input() rangeMin: number;
  @Input() rangeMax: number;
  @Input() min: number;
  @Input() max: number;
  @Input() minLabel: string;
  @Input() maxLabel: string;

  @ViewChild('leftLabel') leftLabel: ElementRef;
  @ViewChild('rightLabel') rightLabel: ElementRef;

  public left = '0%';
  public right = '0%';

  constructor(private cdr: ChangeDetectorRef,
              private renderer: Renderer2) {
  }


  ngOnChanges(changes: SimpleChanges) {
    if(this.rightLabel && this.leftLabel) {
      this.renderer.removeClass(this.rightLabel.nativeElement, 'hidden')
      const total = this.max - this.min
      this.left = ((this.rangeMin - this.min) / total) * 100 + '%';
      this.right = ((this.max - this.rangeMax) / total) * 100 + '%';
      this.cdr.detectChanges();
      const leftLabelRightBounding = this.leftLabel.nativeElement.getBoundingClientRect().right;
      const rightLabelLeftBounding = this.rightLabel.nativeElement.getBoundingClientRect().left;
      if (leftLabelRightBounding > rightLabelLeftBounding) {
        this.renderer.addClass(this.rightLabel.nativeElement, 'hidden')
      }
    }
  }

}
