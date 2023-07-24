import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {TRANSLOCO_SCOPE} from '@ngneat/transloco';
import { AreaComponent } from './area/area.component';
import { AreaFormComponent } from './area-form/area-form.component';
import { AreaInfoComponent } from './area-info/area-info.component';
import { AreaListComponent } from './area-list/area-list.component';



@NgModule({
  declarations: [
    AreaComponent,
    AreaFormComponent,
    AreaInfoComponent,
    AreaListComponent
  ],
  imports: [
    CommonModule
  ],
  providers: [
    {provide: TRANSLOCO_SCOPE, useValue: 'area'}
  ],
})
export class AreaModule { }
