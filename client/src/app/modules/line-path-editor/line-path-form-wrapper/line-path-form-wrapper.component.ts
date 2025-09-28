import { Component } from '@angular/core';
import { LinePathFormComponent } from '../line-path-form/line-path-form.component';
import { Card } from 'primeng/card';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'lc-line-path-form-wrapper',
  imports: [LinePathFormComponent, Card, TranslocoDirective],
  templateUrl: './line-path-form-wrapper.component.html',
  styleUrl: './line-path-form-wrapper.component.scss',
})
export class LinePathFormWrapperComponent {}
