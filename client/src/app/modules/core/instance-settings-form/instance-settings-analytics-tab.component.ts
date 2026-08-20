import { Component, Input } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

@Component({
  selector: 'lc-instance-settings-analytics-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ButtonModule,
    InputTextModule,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './instance-settings-analytics-tab.component.html',
  styleUrl: './instance-settings-analytics-tab.component.scss',
})
export class InstanceSettingsAnalyticsTabComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) save!: () => void;
  @Input() loading = false;
}
