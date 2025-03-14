import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LinePathEditorComponent } from './line-path-editor/line-path-editor.component';
import { LinePathFormComponent } from './line-path-form/line-path-form.component';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { TopoImagesModule } from '../topo-images/topo-images.module';
import { Select } from 'primeng/select';

@NgModule({
  declarations: [LinePathEditorComponent, LinePathFormComponent],
  imports: [
    CommonModule,
    ButtonModule,
    CardModule,
    ReactiveFormsModule,
    SharedModule,
    TranslocoModule,
    FormsModule,
    ReactiveFormsModule,
    TopoImagesModule,
    Select,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'linePath' }],
})
export class LinePathEditorModule {}
