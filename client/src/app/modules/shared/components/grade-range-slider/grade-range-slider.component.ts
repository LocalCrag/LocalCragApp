import { AsyncPipe } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SliderModule } from 'primeng/slider';
import { LineType } from '../../../../enums/line-type';
import { ScalesService } from '../../../../services/crud/scales.service';
import { TranslateSpecialGradesPipe } from '../../pipes/translate-special-grades.pipe';
import { SliderLabelsComponent } from '../slider-labels/slider-labels.component';

@Component({
  selector: 'lc-grade-range-slider',
  imports: [
    SliderLabelsComponent,
    SliderModule,
    FormsModule,
    AsyncPipe,
    TranslateSpecialGradesPipe,
  ],
  templateUrl: './grade-range-slider.component.html',
  styleUrl: './grade-range-slider.component.scss',
})
export class GradeRangeSliderComponent {
  @Input({ required: true }) range: (number | null)[];
  @Output() rangeChange = new EventEmitter<(number | null)[]>();

  @Input({ required: true }) min: number;
  @Input({ required: true }) max: number;
  @Input({ required: true }) lineType: LineType;
  @Input({ required: true }) gradeScale: string;

  @Input() disabled = false;

  @Output() slideEnd = new EventEmitter<void>();

  protected scalesService = inject(ScalesService);

  onRangeChange(value: (number | null)[]): void {
    this.rangeChange.emit(value);
  }
}
