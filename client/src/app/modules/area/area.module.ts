import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TRANSLOCO_SCOPE, TranslocoModule } from '@jsverse/transloco';
import { AreaComponent } from './area/area.component';
import { AreaFormComponent } from './area-form/area-form.component';
import { AreaInfoComponent } from './area-info/area-info.component';
import { DataViewModule } from 'primeng/dataview';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { SharedModule } from '../shared/shared.module';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { EditorModule } from 'primeng/editor';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { SkeletonModule } from 'primeng/skeleton';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { LineModule } from '../line/line.module';
import { TopoImagesModule } from '../topo-images/topo-images.module';
import { LinePathEditorModule } from '../line-path-editor/line-path-editor.module';
import { GradeDistributionBarChartComponent } from '../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import { CoordinatesComponent } from '../shared/forms/controls/coordinates/coordinates.component';
import { CoordinatesButtonComponent } from '../shared/components/coordinates-button/coordinates-button.component';
import { HasPermissionDirective } from '../shared/directives/has-permission.directive';
import { AscentCountComponent } from '../ascent/ascent-count/ascent-count.component';
import { CheckboxModule } from 'primeng/checkbox';
import { SecretSpotTagComponent } from '../shared/components/secret-spot-tag/secret-spot-tag.component';
import { FormSkeletonComponent } from '../shared/components/form-skeleton/form-skeleton.component';
import { MapComponent } from '../maps/map/map.component';
import { MapMarkerFormArrayComponent } from '../maps/map-marker-form-array/map-marker-form-array.component';
import { ClosedSpotTagComponent } from '../shared/components/closed-spot-tag/closed-spot-tag.component';
import { MessageModule } from 'primeng/message';
import { ClosedSpotAlertComponent } from '../shared/components/closed-spot-alert/closed-spot-alert.component';
import { ArchiveButtonComponent } from '../archive/archive-button/archive-button.component';
import { Select } from 'primeng/select';
import { SetActiveTabDirective } from '../shared/directives/set-active-tab.directive';
import { Tab, TabList, Tabs } from 'primeng/tabs';
import { TopoDataviewSkeletonComponent } from '../shared/components/topo-dataview-skeleton/topo-dataview-skeleton.component';

@NgModule({
  declarations: [AreaComponent, AreaFormComponent, AreaInfoComponent],
  imports: [
    CommonModule,
    CardModule,
    TranslocoModule,
    SharedModule,
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
    SkeletonModule,
    BreadcrumbModule,
    LineModule,
    TopoImagesModule,
    LinePathEditorModule,
    GradeDistributionBarChartComponent,
    CoordinatesComponent,
    CoordinatesButtonComponent,
    HasPermissionDirective,
    AscentCountComponent,
    CheckboxModule,
    SecretSpotTagComponent,
    FormSkeletonComponent,
    MapComponent,
    MapMarkerFormArrayComponent,
    ClosedSpotTagComponent,
    MessageModule,
    ClosedSpotAlertComponent,
    ArchiveButtonComponent,
    Select,
    RouterOutlet,
    SetActiveTabDirective,
    Tab,
    TabList,
    Tabs,
    TopoDataviewSkeletonComponent,
  ],
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'area' }],
})
export class AreaModule {}
