import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SectorListComponent } from './sector-list/sector-list.component';
import { CardModule } from 'primeng/card';
import { DataViewModule } from 'primeng/dataview';
import { DropdownModule } from 'primeng/dropdown';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from '../shared/shared.module';
import { RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { SectorInfoComponent } from './sector-info/sector-info.component';
import { SectorComponent } from './sector/sector.component';
import { SectorFormComponent } from './sector-form/sector-form.component';
import { TabMenuModule } from 'primeng/tabmenu';
import { SkeletonModule } from 'primeng/skeleton';
import { MessagesModule } from 'primeng/messages';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { EditorModule } from 'primeng/editor';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { AreaModule } from '../area/area.module';
import { GradeDistributionBarChartComponent } from '../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { ChipModule } from 'primeng/chip';
import { CoordinatesComponent } from '../shared/forms/controls/coordinates/coordinates.component';
import { CoordinatesButtonComponent } from '../shared/components/coordinates-button/coordinates-button.component';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';
import { AscentCountComponent } from '../ascent/ascent-count/ascent-count.component';
import { CheckboxModule } from 'primeng/checkbox';
import { SecretSpotTagComponent } from '../shared/components/secret-spot-tag/secret-spot-tag.component';
import { FormSkeletonComponent } from '../shared/components/form-skeleton/form-skeleton.component';
import { MapComponent } from '../maps/map/map.component';
import { MapMarkerFormArrayComponent } from '../maps/map-marker-form-array/map-marker-form-array.component';
import {ArchiveButtonComponent} from '../archive/archive-button/archive-button.component';
@NgModule({
  declarations: [
    SectorListComponent,
    SectorInfoComponent,
    SectorComponent,
    SectorFormComponent,
  ],
  exports: [SectorListComponent],
  imports: [
    RouterLink,
    CommonModule,
    CardModule,
    TranslocoModule,
    DataViewModule,
    InputTextModule,
    InputTextareaModule,
    ButtonModule,
    SharedModule,
    DropdownModule,
    FormsModule,
    ReactiveFormsModule,
    TabMenuModule,
    SkeletonModule,
    MessagesModule,
    BreadcrumbModule,
    EditorModule,
    ConfirmPopupModule,
    AreaModule,
    GradeDistributionBarChartComponent,
    ChipModule,
    CoordinatesComponent,
    CoordinatesButtonComponent,
    HasPermissionDirective,
    AscentCountComponent,
    CheckboxModule,
    SecretSpotTagComponent,
    FormSkeletonComponent,
    MapComponent,
    MapMarkerFormArrayComponent,
    ArchiveButtonComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'sector' }],
})
export class SectorModule {}
