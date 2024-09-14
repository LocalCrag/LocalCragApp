import {Component, forwardRef, Input, ViewEncapsulation} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';
import {MapMarker} from '../../../models/map-marker';
import {NgForOf, NgIf} from '@angular/common';
import {TRANSLOCO_SCOPE, TranslocoDirective, TranslocoService} from '@jsverse/transloco';
import {ButtonModule} from 'primeng/button';
import {MapMarkerConfigDialogComponent} from '../map-marker-config-dialog/map-marker-config-dialog.component';
import {TagModule} from 'primeng/tag';
import {ConfirmationService} from 'primeng/api';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {marker as translocoMarker} from '@jsverse/transloco-keys-manager/marker';
import {MapMarkerType} from '../../../enums/map-marker-type';

@Component({
  selector: 'lc-map-marker-form-array',
  standalone: true,
  imports: [
    NgForOf,
    TranslocoDirective,
    NgIf,
    ButtonModule,
    MapMarkerConfigDialogComponent,
    TagModule,
    ConfirmDialogModule
  ],
  templateUrl: './map-marker-form-array.component.html',
  styleUrl: './map-marker-form-array.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MapMarkerFormArrayComponent),
      multi: true,
    },
    ConfirmationService,
  { provide: TRANSLOCO_SCOPE, useValue: 'maps' },
  ],
  encapsulation: ViewEncapsulation.None,
})
export class MapMarkerFormArrayComponent implements ControlValueAccessor {

  @Input() disabledMarkerTypes: MapMarkerType[] = [];
  @Input() defaultMarkerType: MapMarkerType = null;

  public markers: MapMarker[] = [];
  public isDisabled = false;

  constructor(private confirmationService: ConfirmationService,
              private translocoService: TranslocoService) {
  }

  writeValue(value: MapMarker[]): void {
    this.markers = value;
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(fn: any): void {
  }

  propagateChange = (_: any) => {
  };

  onChange() {
    this.propagateChange(this.markers);
  }

  addMarker(marker: MapMarker) {
    this.markers.push(marker);
    this.onChange();
    // TODO toast
  }

  removeMarker(marker: MapMarker) {
    this.markers.splice(this.markers.indexOf(marker), 1);
    this.onChange();
    // TODO toast
  }

  setDisabledState(isDisabled: boolean) {
    this.isDisabled = isDisabled;
  }

  showDescriptionDialog(event: Event, marker: MapMarker) {
      this.confirmationService.confirm({
        target: event.target as EventTarget,
        message:  marker.description,
        header: this.translocoService.translate(translocoMarker('maps.markerList.header')),
        icon: 'pi pi-align-left',
        acceptIcon:"none",
        rejectVisible: false,
        acceptLabel: this.translocoService.translate(translocoMarker('maps.markerList.closeDescriptionDialog')),
    });
  }

}
