import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CragFormComponent } from './crag-form/crag-form.component';
import { CardModule } from 'primeng/card';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { SharedModule } from '../shared/shared.module';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { ButtonModule } from 'primeng/button';
import { CragListComponent } from './crag-list/crag-list.component';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { RouterLink } from '@angular/router';
import { DropdownModule } from 'primeng/dropdown';
import { CragComponent } from './crag/crag.component';
import { MessagesModule } from 'primeng/messages';
import { EditorModule } from 'primeng/editor';
import { TabMenuModule } from 'primeng/tabmenu';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { SectorModule } from '../sector/sector.module';
import { CragInfoComponent } from './crag-info/crag-info.component';
import { SkeletonModule } from 'primeng/skeleton';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { GradeDistributionBarChartComponent } from '../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { CoordinatesComponent } from '../shared/forms/controls/coordinates/coordinates.component';
import { CoordinatesButtonComponent } from '../shared/components/coordinates-button/coordinates-button.component';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';
import { AscentCountComponent } from '../ascent/ascent-count/ascent-count.component';
import { CheckboxModule } from 'primeng/checkbox';
import { SecretSpotTagComponent } from '../shared/components/secret-spot-tag/secret-spot-tag.component';
import { MapMarkerFormArrayComponent } from '../maps/map-marker-form-array/map-marker-form-array.component';
import { MapComponent } from '../maps/map/map.component';
import {ArchiveButtonComponent} from '../archive/archive-button/archive-button.component';
/**
 * Module for crags.
 */
@NgModule({
  declarations: [
    CragFormComponent,
    CragListComponent,
    CragComponent,
    CragInfoComponent,
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
    BreadcrumbModule,
    GradeDistributionBarChartComponent,
    CoordinatesComponent,
    CoordinatesButtonComponent,
    HasPermissionDirective,
    AscentCountComponent,
    CheckboxModule,
    SecretSpotTagComponent,
    MapMarkerFormArrayComponent,
    MapComponent,
    ArchiveButtonComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'crag' }],
  exports: [CragFormComponent],
})
export class CragModule {}
