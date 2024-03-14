import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TopoImageListComponent} from './topo-image-list/topo-image-list.component';
import {TopoImageFormComponent} from './topo-image-form/topo-image-form.component';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {RouterLink, RouterModule} from '@angular/router';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@ngneat/transloco';
import {SharedModule} from '../shared/shared.module';
import {CardModule} from 'primeng/card';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {TableModule} from 'primeng/table';
import {RatingModule} from 'primeng/rating';
import {LineModule} from '../line/line.module';
import {MessagesModule} from 'primeng/messages';
import {MessageModule} from 'primeng/message';
import {TagModule} from 'primeng/tag';
import {InputTextModule} from 'primeng/inputtext';
import {EditorModule} from 'primeng/editor';


@NgModule({
    declarations: [
        TopoImageListComponent,
        TopoImageFormComponent,
    ],
  imports: [
    CommonModule,
    CardModule,
    DataViewModule,
    DropdownModule,
    FormsModule,
    ButtonModule,
    RouterLink,
    SharedModule,
    TranslocoModule,
    ReactiveFormsModule,
    ConfirmPopupModule,
    TableModule,
    RatingModule,
    LineModule,
    MessagesModule,
    MessageModule,
    TagModule,
    InputTextModule,
    EditorModule
  ],
    providers: [
        {provide: TRANSLOCO_SCOPE, useValue: 'topoImage'}
    ],
    exports: [
        TopoImageListComponent,
    ],
})
export class TopoImagesModule {
}
