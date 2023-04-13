import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActionsListComponent } from './actions-list/actions-list.component';
import {DataViewModule} from 'primeng/dataview';
import {PaginatorModule} from 'primeng/paginator';
import {RatingModule} from 'primeng/rating';
import {ButtonModule} from 'primeng/button';
import {AppModule} from '../app.module';
import {SharedModule} from '../shared/shared.module';



@NgModule({
  declarations: [
    ActionsListComponent
  ],
  exports: [
    ActionsListComponent
  ],
    imports: [
        CommonModule,
        DataViewModule,
        PaginatorModule,
        RatingModule,
        ButtonModule,
      SharedModule
    ]
})
export class ActionsModule { }
