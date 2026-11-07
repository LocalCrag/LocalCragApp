import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { Select } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { StorageUsageComponent } from './storage-usage/storage-usage.component';

@Component({
  selector: 'lc-instance-settings-storage-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    ButtonModule,
    Select,
    TooltipModule,
    ControlGroupDirective,
    FormControlDirective,
    StorageUsageComponent,
  ],
  templateUrl: './instance-settings-storage-tab.component.html',
  styleUrl: './instance-settings-storage-tab.component.scss',
})
export class InstanceSettingsStorageTabComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;
}
