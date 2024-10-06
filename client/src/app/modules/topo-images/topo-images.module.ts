import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TopoImageListComponent} from './topo-image-list/topo-image-list.component';
import {TopoImageFormComponent} from './topo-image-form/topo-image-form.component';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@jsverse/transloco';
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
import {TopoImageDetailsComponent} from './topo-image-details/topo-image-details.component';
import {HasPermissionDirective} from '../shared/directives/has-permission.directive';
import {TickButtonComponent} from '../ascent/tick-button/tick-button.component';
import {TodoButtonComponent} from '../todo/todo-button/todo-button.component';
import {CoordinatesComponent} from '../shared/forms/controls/coordinates/coordinates.component';
import {ArchiveButtonComponent} from '../archive/archive-button/archive-button.component';

@NgModule({
  declarations: [TopoImageListComponent, TopoImageFormComponent],
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
    EditorModule,
    TopoImageDetailsComponent,
    CoordinatesComponent,
    HasPermissionDirective,
    TickButtonComponent,
    TodoButtonComponent,
    CoordinatesComponent,
    ArchiveButtonComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'topoImage' }],
  exports: [TopoImageListComponent],
})
export class TopoImagesModule {}
