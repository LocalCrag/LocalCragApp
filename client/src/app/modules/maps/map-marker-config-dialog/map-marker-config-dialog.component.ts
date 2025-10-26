import {
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output,
  QueryList,
  SimpleChanges,
  ViewChild,
  ViewChildren,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { Editor, EditorModule } from 'primeng/editor';
import { CoordinatesComponent } from '../../shared/forms/controls/coordinates/coordinates.component';
import { ColorPickerModule } from 'primeng/colorpicker';
import { ToggleButtonModule } from 'primeng/togglebutton';
import {
  MAP_MARKER_TYPES,
  MapMarkerType,
} from '../../../enums/map-marker-type';
import { FormDirective } from '../../shared/forms/form.directive';
import { MapMarker } from '../../../models/map-marker';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';

import { Select } from 'primeng/select';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-map-marker-config-dialog',
  imports: [
    ReactiveFormsModule,
    InputTextModule,
    TranslocoDirective,
    EditorModule,
    CoordinatesComponent,
    ColorPickerModule,
    ToggleButtonModule,
    DialogModule,
    ButtonModule,
    Select,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './map-marker-config-dialog.component.html',
  styleUrl: './map-marker-config-dialog.component.scss',
  providers: [{ provide: TRANSLOCO_SCOPE, useValue: 'maps' }],
})
export class MapMarkerConfigDialogComponent implements OnInit, OnChanges {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  @Output() newMarker = new EventEmitter<MapMarker>();

  @Input() disabledMarkerTypes: MapMarkerType[] = [];
  @Input() existingMarkers: MapMarker[] = [];
  @Input() defaultMarkerType: MapMarkerType = null;

  public types: MapMarkerType[] = [];
  public mapMarkerForm: FormGroup;
  public isOpen = false;
  public marker: MapMarker;
  public nameAndDescriptionHidden = false;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);

  ngOnInit() {
    this.buildForm();
    this.setTypes();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes.existingMarkers) {
      this.setTypes();
    }
  }

  private setTypes() {
    this.types = MAP_MARKER_TYPES.filter(
      (type) => !this.disabledMarkerTypes.includes(type),
    );
    this.types = this.types.filter(
      (type) => !this.disabledToPreventTypeDuplicates(type),
    );
  }

  private buildForm() {
    this.mapMarkerForm = this.fb.group({
      name: ['', [Validators.maxLength(120)]],
      description: [''],
      coordinates: [null],
      type: [null, [Validators.required]],
    });
    const baseTypes = [
      MapMarkerType.AREA,
      MapMarkerType.SECTOR,
      MapMarkerType.CRAG,
      MapMarkerType.TOPO_IMAGE,
    ];
    this.mapMarkerForm
      .get('type')
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.nameAndDescriptionHidden = baseTypes.includes(
          this.mapMarkerForm.get('type').value,
        );
        if (this.nameAndDescriptionHidden) {
          this.mapMarkerForm.get('name').reset();
          this.mapMarkerForm.get('description').reset();
        }
      });
  }

  private setFormValue() {
    this.mapMarkerForm.enable();
    this.mapMarkerForm.patchValue({
      name: this.marker.name,
      description: this.marker.description,
      coordinates: this.marker.coordinates,
      type: this.marker.type,
    });
  }

  public open(marker?: MapMarker) {
    if (!marker) {
      marker = new MapMarker();
      marker.type = this.defaultMarkerType;
    }
    this.marker = marker;
    this.setFormValue();
    this.isOpen = true;
    this.setTypes();
  }

  public close() {
    this.isOpen = false;
  }

  public save() {
    if (this.mapMarkerForm.valid) {
      this.marker.name = this.mapMarkerForm.get('name').value || null;
      this.marker.description =
        this.mapMarkerForm.get('description').value || null;
      this.marker.coordinates = this.mapMarkerForm.get('coordinates').value;
      this.marker.type = this.mapMarkerForm.get('type').value;
      if (!this.marker.id) {
        this.newMarker.emit(this.marker);
      }
      this.isOpen = false;
    } else {
      this.mapMarkerForm.markAllAsTouched();
    }
  }

  /**
   * There can only be one marker of types CRAG, SECTOR and AREA for a single parent entity.
   */
  public disabledToPreventTypeDuplicates(type: MapMarkerType): boolean {
    const restrictedTypes = [
      MapMarkerType.CRAG,
      MapMarkerType.SECTOR,
      MapMarkerType.AREA,
    ];
    if (
      !restrictedTypes.includes(type) ||
      restrictedTypes.includes(this.marker?.type)
    ) {
      return false;
    }
    return this.existingMarkers.some((marker) => marker.type === type);
  }
}
