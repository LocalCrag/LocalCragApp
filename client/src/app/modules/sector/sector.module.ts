import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectorListComponent } from './sector-list/sector-list.component';
import {CardModule} from 'primeng/card';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {SharedModule} from '../shared/shared.module';
import {RouterLink} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';



@NgModule({
  declarations: [
    SectorListComponent
  ],
  exports: [
    SectorListComponent
  ],
  imports: [
    RouterLink,
    CommonModule,
    CardModule,
    DataViewModule,
    ButtonModule,
    SharedModule,
    DropdownModule,
    FormsModule,
    ReactiveFormsModule
  ]
})
export class SectorModule { }
