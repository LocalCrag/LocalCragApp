import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopoImageFormComponent } from './topo-image-form/topo-image-form.component';
import { DataViewModule } from 'primeng/dataview';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { RouterLink } from '@angular/router';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { SharedModule } from '../shared/shared.module';
import { CardModule } from 'primeng/card';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { TableModule } from 'primeng/table';
import { RatingModule } from 'primeng/rating';
import { LineModule } from '../line/line.module';
import { MessageModule } from 'primeng/message';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { EditorModule } from 'primeng/editor';
import { TopoImageDetailsComponent } from './topo-image-details/topo-image-details.component';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';
import { TickButtonComponent } from '../ascent/tick-button/tick-button.component';
import { TodoButtonComponent } from '../todo/todo-button/todo-button.component';
import { CoordinatesComponent } from '../shared/forms/controls/coordinates/coordinates.component';
import { ClosedSpotTagComponent } from '../shared/components/closed-spot-tag/closed-spot-tag.component';
import { ArchiveButtonComponent } from '../archive/archive-button/archive-button.component';
import { GymModeDirective } from '../shared/directives/gym-mode.directive';
import { Select } from 'primeng/select';
import { TopoImageListSkeletonComponent } from './topo-image-list-skeleton/topo-image-list-skeleton.component';

@NgModule({
  declarations: [TopoImageFormComponent],
  imports: [
    CommonModule,
    CardModule,
    DataViewModule,
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
    ClosedSpotTagComponent,
    ArchiveButtonComponent,
    GymModeDirective,
    Select,
    TopoImageListSkeletonComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'topoImage' }],
})
export class TopoImagesModule {}
