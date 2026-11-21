import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgxColorsModule } from 'ngx-colors';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleHelp, lucideSave } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSeparator } from '@spartan-ng/helm/separator';
import { HlmSwitch } from '@spartan-ng/helm/switch';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';

@Component({
  selector: 'lc-instance-settings-appearance-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    NgxColorsModule,
    NgIcon,
    HlmButton,
    HlmSeparator,
    HlmSwitch,
    HlmTooltip,
    SingleImageUploadComponent,
    ControlGroupDirective,
    FormControlDirective,
  ],
  templateUrl: './instance-settings-appearance-tab.component.html',
  providers: [provideIcons({ lucideCircleHelp, lucideSave })],
  styleUrl: './instance-settings-appearance-tab.component.scss',
})
export class InstanceSettingsAppearanceTabComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;
}
