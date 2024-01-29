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
import {LineListComponent} from '../line/line-list/line-list.component';
import {SharedModule} from '../shared/shared.module';
import {CardModule} from 'primeng/card';
import {ConfirmPopupModule} from 'primeng/confirmpopup';


@NgModule({
    declarations: [
        TopoImageListComponent,
        TopoImageFormComponent
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
        ConfirmPopupModule
    ],
    providers: [
        {provide: TRANSLOCO_SCOPE, useValue: 'topoImage'}
    ],
    exports: [
        TopoImageListComponent
    ],
})
export class TopoImagesModule {
}
