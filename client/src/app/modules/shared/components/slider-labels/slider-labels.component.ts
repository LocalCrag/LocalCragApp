import {ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {TranslocoPipe} from '@ngneat/transloco';

// TODO handle overlapping labels

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

  public left = '0%';
  public right = '0%';

  constructor(private cdr: ChangeDetectorRef) {
  }


  ngOnChanges(changes: SimpleChanges) {
    const total = this.max - this.min
    this.left = ((this.rangeMin - this.min) / total) * 100 + '%';
    this.right = ((this.max - this.rangeMax) / total) * 100 + '%';
  }

}
