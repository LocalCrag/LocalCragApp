import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SectorListComponent} from './sector-list/sector-list.component';
import {CardModule} from 'primeng/card';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {ButtonModule} from 'primeng/button';
import {SharedModule} from '../shared/shared.module';
import {RouterLink} from '@angular/router';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@ngneat/transloco';
import {SectorInfoComponent} from './sector-info/sector-info.component';
import {SectorComponent} from './sector/sector.component';
import {SectorFormComponent} from './sector-form/sector-form.component';
import {TabMenuModule} from 'primeng/tabmenu';
import {SkeletonModule} from 'primeng/skeleton';
import {MessagesModule} from 'primeng/messages';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {EditorModule} from 'primeng/editor';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {InputTextModule} from 'primeng/inputtext';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {AreaModule} from '../area/area.module';
import {
    GradeDistributionBarChartComponent
} from '../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import {ChipModule} from 'primeng/chip';
import {GpsComponent} from '../shared/forms/controls/gps/gps.component';
import {GpsButtonComponent} from '../shared/components/gps-button/gps-button.component';
import {HasPermissionDirective} from '../shared/directives/has-permission.directive';


@NgModule({
  declarations: [
    SectorListComponent,
    SectorInfoComponent,
    SectorComponent,
    SectorFormComponent
  ],
  exports: [
    SectorListComponent
  ],
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
        GpsComponent,
        GpsButtonComponent,
        HasPermissionDirective,
    ],
  providers: [
    {provide: TRANSLOCO_SCOPE, useValue: 'sector'}
  ],
})
export class SectorModule {
}
