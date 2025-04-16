import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { TopoImagesModule } from '../topo-images/topo-images.module';
import { Select } from 'primeng/select';
import { GymModeDirective } from '../shared/directives/gym-mode.directive';

@NgModule({
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ReactiveFormsModule,
    TranslocoModule,
    FormsModule,
    ReactiveFormsModule,
    TopoImagesModule,
    Select,
    GymModeDirective,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'linePath' }],
})
export class LinePathEditorModule {}
