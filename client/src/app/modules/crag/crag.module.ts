import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CragFormComponent} from './crag-form/crag-form.component';
import {CardModule} from 'primeng/card';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@ngneat/transloco';
import {SharedModule} from '../shared/shared.module';
import {InputTextModule} from 'primeng/inputtext';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {ButtonModule} from 'primeng/button';
import {CragListComponent} from './crag-list/crag-list.component';
import {DataViewModule} from 'primeng/dataview';
import {TagModule} from 'primeng/tag';
import {BadgeModule} from 'primeng/badge';
import {RouterLink} from '@angular/router';
import {DropdownModule} from 'primeng/dropdown';
import {CragComponent} from './crag/crag.component';
import {MessagesModule} from 'primeng/messages';
import {EditorModule} from 'primeng/editor';
import {TabMenuModule} from 'primeng/tabmenu';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {SectorModule} from '../sector/sector.module';
import {CragInfoComponent} from './crag-info/crag-info.component';
import {SkeletonModule} from 'primeng/skeleton';
import {BreadcrumbModule} from 'primeng/breadcrumb';


/**
 * Module for crags.
 */
@NgModule({
  declarations: [
    CragFormComponent,
    CragListComponent,
    CragComponent,
    CragInfoComponent
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
    SectorModule,
    SkeletonModule,
    BreadcrumbModule
  ],
  providers: [
    {provide: TRANSLOCO_SCOPE, useValue: 'crag'}
  ],
  exports: [
    CragFormComponent
  ]
})
export class CragModule {
}
