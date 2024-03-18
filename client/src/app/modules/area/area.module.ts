import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@ngneat/transloco';
import {AreaComponent} from './area/area.component';
import {AreaFormComponent} from './area-form/area-form.component';
import {AreaInfoComponent} from './area-info/area-info.component';
import {AreaListComponent} from './area-list/area-list.component';
import {DataViewModule} from 'primeng/dataview';
import {DropdownModule} from 'primeng/dropdown';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ButtonModule} from 'primeng/button';
import {SharedModule} from '../shared/shared.module';
import {RouterLink} from '@angular/router';
import {CardModule} from 'primeng/card';
import {InputTextModule} from 'primeng/inputtext';
import {InputTextareaModule} from 'primeng/inputtextarea';
import {TagModule} from 'primeng/tag';
import {BadgeModule} from 'primeng/badge';
import {MessagesModule} from 'primeng/messages';
import {EditorModule} from 'primeng/editor';
import {TabMenuModule} from 'primeng/tabmenu';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {SectorModule} from '../sector/sector.module';
import {SkeletonModule} from 'primeng/skeleton';
import {BreadcrumbModule} from 'primeng/breadcrumb';
import {LineModule} from '../line/line.module';
import {TopoImagesModule} from '../topo-images/topo-images.module';
import {LinePathEditorModule} from '../line-path-editor/line-path-editor.module';
import {
    GradeDistributionBarChartComponent
} from '../shared/components/grade-distribution-bar-chart/grade-distribution-bar-chart.component';
import {GpsComponent} from '../shared/forms/controls/gps/gps.component';
import {GpsButtonComponent} from '../shared/components/gps-button/gps-button.component';


@NgModule({
    declarations: [
        AreaComponent,
        AreaFormComponent,
        AreaInfoComponent,
        AreaListComponent
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
        BreadcrumbModule,
        LineModule,
        TopoImagesModule,
        LinePathEditorModule,
        GradeDistributionBarChartComponent,
        GpsComponent,
        GpsButtonComponent
    ],
    exports: [
        AreaListComponent
    ],
    providers: [
        {provide: TRANSLOCO_SCOPE, useValue: 'area'}
    ],
})
export class AreaModule {
}
