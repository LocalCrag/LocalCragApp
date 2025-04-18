import { NgModule } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { DatePipe } from './pipes/date.pipe';
import { FormDirective } from './forms/form.directive';
import { IfNoErrorDirective } from './forms/if-no-error.directive';
import { IfErrorDirective } from './forms/if-error.directive';
import { FormControlDirective } from './forms/form-control.directive';
import { ControlGroupDirective } from './forms/control-group.directive';
import { MinutesRemainingPipe } from './pipes/minutes-remaining.pipe';
import { TagModule } from 'primeng/tag';
import { BadgeModule } from 'primeng/badge';
import { SingleImageUploadComponent } from './forms/controls/single-image-upload/single-image-upload.component';
import { FileUploadModule } from 'primeng/fileupload';
import { ImageModule } from 'primeng/image';
import { TranslocoModule } from '@jsverse/transloco';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TopoImageComponent } from './components/topo-image/topo-image.component';
import { OrderListModule } from 'primeng/orderlist';
import { AsFormArrayPipe } from './pipes/as-form-array.pipe';
import { AsFormGroupPipe } from './pipes/as-form-group.pipe';
import { SanitizeHtmlPipe } from './pipes/sanitize-html.pipe';
import { ToStringPipe } from './pipes/to-string.pipe';
import { SkeletonModule } from 'primeng/skeleton';
import { ChartModule } from 'primeng/chart';
import { ChipModule } from 'primeng/chip';
import { TranslateSpecialGradesPipe } from './pipes/translate-special-grades.pipe';
import { LineGradePipe } from './pipes/line-grade.pipe';
import { MeterGroupModule } from 'primeng/metergroup';
import { ProgressBar } from 'primeng/progressbar';
import { Button } from 'primeng/button';

/**
 * Module for shared components, pipes etc.
 */
@NgModule({
  declarations: [
    DatePipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    SingleImageUploadComponent,
    TopoImageComponent,
    AsFormArrayPipe,
    AsFormGroupPipe,
    LineGradePipe,
    SanitizeHtmlPipe,
    ToStringPipe,
    TranslateSpecialGradesPipe,
  ],
  imports: [
    CommonModule,
    TagModule,
    BadgeModule,
    FileUploadModule,
    ImageModule,
    TranslocoModule,
    ProgressSpinnerModule,
    OrderListModule,
    SkeletonModule,
    ChartModule,
    ChipModule,
    MeterGroupModule,
    ProgressBar,
    Button,
  ],
  exports: [
    DatePipe,
    FormDirective,
    IfNoErrorDirective,
    IfErrorDirective,
    FormControlDirective,
    ControlGroupDirective,
    MinutesRemainingPipe,
    SingleImageUploadComponent,
    TopoImageComponent,
    AsFormArrayPipe,
    AsFormGroupPipe,
    LineGradePipe,
    SanitizeHtmlPipe,
    TranslateSpecialGradesPipe,
  ],
  providers: [AsyncPipe, TranslateSpecialGradesPipe],
})
export class SharedModule {}
