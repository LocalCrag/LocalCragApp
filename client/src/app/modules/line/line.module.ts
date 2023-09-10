import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {LineComponent} from './line/line.component';
import {LineFormComponent} from './line-form/line-form.component';
import {LineListComponent} from './line-list/line-list.component';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@ngneat/transloco';
import {CardModule} from 'primeng/card';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {SharedModule} from '../shared/shared.module';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {TagModule} from 'primeng/tag';
import {BadgeModule} from 'primeng/badge';
import {MessagesModule} from 'primeng/messages';
import {EditorModule} from 'primeng/editor';
import {TabMenuModule} from 'primeng/tabmenu';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {SkeletonModule} from 'primeng/skeleton';
import {BreadcrumbModule} from 'primeng/breadcrumb';


@NgModule({
  declarations: [
    LineComponent,
    LineFormComponent,
    LineListComponent
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
    ButtonModule,
    DataViewModule,
    TagModule,
    BadgeModule,
    RouterLink,
    DropdownModule,
    MessagesModule,
    EditorModule,
    TabMenuModule,
    ConfirmPopupModule,
    SkeletonModule,
    BreadcrumbModule
  ],
  exports: [
    LineListComponent
  ],
  providers: [
    {provide: TRANSLOCO_SCOPE, useValue: 'line'}
  ]
})
export class LineModule {
}
