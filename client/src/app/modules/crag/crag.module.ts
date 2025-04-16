import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { InputTextModule } from 'primeng/inputtext';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { DataViewModule } from 'primeng/dataview';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { RouterLink, RouterOutlet } from '@angular/router';
import { EditorModule } from 'primeng/editor';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { SectorModule } from '../sector/sector.module';
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
import { ClosedSpotTagComponent } from '../shared/components/closed-spot-tag/closed-spot-tag.component';
import { ClosedSpotAlertComponent } from '../shared/components/closed-spot-alert/closed-spot-alert.component';
import { SeasonChartComponent } from '../shared/components/season-chart/season-chart.component';
import { ArchiveButtonComponent } from '../archive/archive-button/archive-button.component';
import { Select } from 'primeng/select';
import { SetActiveTabDirective } from '../shared/directives/set-active-tab.directive';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { TopoDataviewSkeletonComponent } from '../shared/components/topo-dataview-skeleton/topo-dataview-skeleton.component';

/**
 * Module for crags.
 */
@NgModule({
  imports: [
    CommonModule,
    CardModule,
    TranslocoModule,
    InputTextModule,
    FormsModule,
    ReactiveFormsModule,
    ButtonModule,
    DataViewModule,
    TagModule,
    BadgeModule,
    RouterLink,
    EditorModule,
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
    ClosedSpotTagComponent,
    ClosedSpotAlertComponent,
    SeasonChartComponent,
    ArchiveButtonComponent,
    Select,
    RouterOutlet,
    SetActiveTabDirective,
    Tab,
    TabList,
    Tabs,
    TopoDataviewSkeletonComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'crag' }],
})
export class CragModule {}
