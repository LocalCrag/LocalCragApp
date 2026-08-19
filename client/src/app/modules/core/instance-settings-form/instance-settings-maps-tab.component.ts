import { Component, Input } from '@angular/core';
import { FormArray, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslocoDirective, TranslocoPipe } from '@jsverse/transloco';
import { ButtonModule } from 'primeng/button';
import { Checkbox } from 'primeng/checkbox';
import { ColorPickerModule } from 'primeng/colorpicker';
import { InputNumberModule } from 'primeng/inputnumber';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelect } from 'primeng/multiselect';
import { Select } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { FormEntryRowComponent } from '../../shared/components/form-entry-row/form-entry-row.component';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';

@Component({
  selector: 'lc-instance-settings-maps-tab',
  imports: [
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    ButtonModule,
    Checkbox,
    ColorPickerModule,
    InputNumberModule,
    InputTextModule,
    MultiSelect,
    Select,
    TooltipModule,
    FormEntryRowComponent,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './instance-settings-maps-tab.component.html',
  styleUrl: './instance-settings-maps-tab.component.scss',
})
export class InstanceSettingsMapsTabComponent {
  @Input({ required: true }) group!: FormGroup;
  @Input({ required: true }) loadingState!: number;
  @Input({ required: true }) loadingStates!: any;
  @Input({ required: true }) sourceKindOptions!: any[];
  @Input({ required: true }) overlayTypeOptions!: any[];
  @Input({ required: true }) paintModeOptions!: any[];
  @Input({ required: true }) tileSizeOptions!: any[];
  @Input({ required: true }) tileJsonMetaByOverlay!: Record<number, any>;
  @Input({ required: true }) overlaySelectOptions!: () => {
    label: string;
    value: string;
  }[];
  @Input({ required: true }) mapBaseLayersControls!: () => FormArray;
  @Input({ required: true }) mapOverlaysControls!: () => FormArray;
  @Input({ required: true }) vectorLayersControls!: (
    overlayIndex: number,
  ) => FormArray;
  @Input({ required: true }) categoricalStopsControls!: (
    overlayIndex: number,
    layerIndex: number,
  ) => FormArray;
  @Input({ required: true }) addBaseLayer!: () => void;
  @Input({ required: true }) removeBaseLayer!: (index: number) => void;
  @Input({ required: true }) moveBaseLayer!: (
    index: number,
    direction: 'up' | 'down',
  ) => void;
  @Input({ required: true }) onBaseLayerRoleDefaultChange!: (
    index: number,
    role: 'topoDefault' | 'rockExplorerDefault',
    checked: boolean,
  ) => void;
  @Input({ required: true }) onOverlayTypeChange!: (
    overlayIndex: number,
  ) => void;
  @Input({ required: true }) addVectorLayer!: (overlayIndex: number) => void;
  @Input({ required: true }) removeVectorLayer!: (
    overlayIndex: number,
    layerIndex: number,
  ) => void;
  @Input({ required: true }) moveVectorLayer!: (
    overlayIndex: number,
    layerIndex: number,
    direction: 'up' | 'down',
  ) => void;
  @Input({ required: true }) addMapLayer!: () => void;
  @Input({ required: true }) removeMapLayer!: (index: number) => void;
  @Input({ required: true }) moveMapLayer!: (
    index: number,
    direction: 'up' | 'down',
  ) => void;
  @Input({ required: true }) onVectorPaintModeChange!: (
    overlayIndex: number,
    layerIndex: number,
  ) => void;
  @Input({ required: true }) tileJsonAttributeOptions!: (
    overlayIndex: number,
    layerIndex: number,
  ) => { label: string; value: string }[];
  @Input({ required: true }) loadTileJsonAttributes!: (
    overlayIndex: number,
  ) => void;
  @Input({ required: true }) seedCategoricalStopsFromTileJson!: (
    overlayIndex: number,
    layerIndex: number,
  ) => void;
  @Input({ required: true }) addCategoricalStop!: (
    overlayIndex: number,
    layerIndex: number,
  ) => void;
  @Input({ required: true }) removeCategoricalStop!: (
    overlayIndex: number,
    layerIndex: number,
    stopIndex: number,
  ) => void;
  @Input({ required: true }) save!: () => void;
}
