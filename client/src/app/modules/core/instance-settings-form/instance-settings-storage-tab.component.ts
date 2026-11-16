import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCircleHelp, lucideSave } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmSelectImports } from '@spartan-ng/helm/select';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { selectItemLabel } from '../select-item-label';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { StorageUsageComponent } from './storage-usage/storage-usage.component';

@Component({
  selector: 'lc-instance-settings-storage-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    NgIcon,
    HlmButton,
    HlmSelectImports,
    HlmTooltip,
    ControlGroupDirective,
    FormControlDirective,
    StorageUsageComponent,
  ],
  templateUrl: './instance-settings-storage-tab.component.html',
  providers: [provideIcons({ lucideCircleHelp, lucideSave })],
  styleUrl: './instance-settings-storage-tab.component.scss',
})
export class InstanceSettingsStorageTabComponent {
  protected readonly selectItemLabel = selectItemLabel;
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;
}
