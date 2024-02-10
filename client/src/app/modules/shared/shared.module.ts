import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MomentPipe} from './pipes/moment.pipe';
import {FormDirective} from './forms/form.directive';
import {IfNoErrorDirective} from './forms/if-no-error.directive';
import {IfErrorDirective} from './forms/if-error.directive';
import {FormControlDirective} from './forms/form-control.directive';
import {ControlGroupDirective} from './forms/control-group.directive';
import {MinutesRemainingPipe} from './pipes/minutes-remaining.pipe';
import {
  LeveledGradeDistributionComponent
} from './components/leveled-grade-distribution/leveled-grade-distribution.component';
import {TagModule} from 'primeng/tag';
import {BadgeModule} from 'primeng/badge';
import {SingleImageUploadComponent} from './forms/controls/single-image-upload/single-image-upload.component';
import {FileUploadModule} from 'primeng/fileupload';
import {ImageModule} from 'primeng/image';
import {TRANSLOCO_SCOPE, TranslocoModule} from '@ngneat/transloco';
import {ProgressSpinnerModule} from 'primeng/progressspinner';
import {TopoImageComponent} from './components/topo-image/topo-image.component';
import { OrderItemsComponent } from './components/order-items/order-items.component';
import {OrderListModule} from 'primeng/orderlist';
import { AsFormArrayPipe } from './pipes/as-form-array.pipe';
import { AsFormGroupPipe } from './pipes/as-form-group.pipe';
import { SanitizeHtmlPipe } from './pipes/sanitize-html.pipe';

/**
 * Module for shared components, pipes etc.
 */
@NgModule({
  declarations: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    LeveledGradeDistributionComponent,
    SingleImageUploadComponent,
    TopoImageComponent,
    OrderItemsComponent,
    AsFormArrayPipe,
    AsFormGroupPipe,
    SanitizeHtmlPipe,
  ],
  imports: [
    CommonModule,
    TagModule,
    BadgeModule,
    FileUploadModule,
    ImageModule,
    TranslocoModule,
    ProgressSpinnerModule,
    OrderListModule
  ],
  exports: [
    MomentPipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    LeveledGradeDistributionComponent,
    SingleImageUploadComponent,
    TopoImageComponent,
    AsFormArrayPipe,
    AsFormGroupPipe,
    SanitizeHtmlPipe
  ]
})
export class SharedModule {
}
