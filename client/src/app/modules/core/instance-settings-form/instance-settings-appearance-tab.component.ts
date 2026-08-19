import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { ColorPickerModule } from 'primeng/colorpicker';
import { DividerModule } from 'primeng/divider';
import { TooltipModule } from 'primeng/tooltip';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';

@Component({
  selector: 'lc-instance-settings-appearance-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonModule,
    ColorPickerModule,
    DividerModule,
    TooltipModule,
    SingleImageUploadComponent,
    ControlGroupDirective,
    FormControlDirective,
  ],
  templateUrl: './instance-settings-appearance-tab.component.html',
  styleUrl: './instance-settings-appearance-tab.component.scss',
})
export class InstanceSettingsAppearanceTabComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;
}
