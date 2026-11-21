import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HlmSlider } from '@spartan-ng/helm/slider';
import { SliderLabelsComponent } from '../slider-labels/slider-labels.component';

@Component({
  selector: 'lc-rating-range-slider',
  imports: [SliderLabelsComponent, HlmSlider],
  templateUrl: './rating-range-slider.component.html',
  styleUrl: './rating-range-slider.component.scss',
})
export class RatingRangeSliderComponent {
  @Input({ required: true }) range: number[];
  @Output() rangeChange = new EventEmitter<number[]>();

  @Input() min = 0;
  @Input() max = 5;
  @Input() disabled = false;

  @Output() slideEnd = new EventEmitter<void>();

  get sliderValue(): number[] {
    return [this.range?.[0] ?? this.min, this.range?.[1] ?? this.max];
  }

  onRangeChange(value: number[]): void {
    this.rangeChange.emit(value);
  }
}
