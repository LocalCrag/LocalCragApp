import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CragFormComponent } from './crag-form/crag-form.component';
import {CardModule} from 'primeng/card';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@ngneat/transloco';
import {SharedModule} from '../shared/shared.module';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {ButtonModule} from 'primeng/button';



@NgModule({
  declarations: [
    CragFormComponent
  ],
  imports: [
    CommonModule,
    CardModule,
    TranslocoModule,
    SharedModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextareaModule,
    ButtonModule
  ],
  providers: [
    {provide: TRANSLOCO_SCOPE, useValue: 'crag'}
  ],
  exports: [
    CragFormComponent
  ]
})
export class CragModule { }
