import {
  ChangeDetectorRef,
  Component,
  forwardRef,
  Input,
  ViewEncapsulation,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MapMarker } from '../../../models/map-marker';

import { TRANSLOCO_SCOPE, TranslocoDirective } from '@jsverse/transloco';
import { MapMarkerConfigDialogComponent } from '../map-marker-config-dialog/map-marker-config-dialog.component';
import { MapMarkerType } from '../../../enums/map-marker-type';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmDialogImports } from '@spartan-ng/helm/dialog';
import { SanitizeHtmlPipe } from '../../shared/pipes/sanitize-html.pipe';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideAlignLeft,
  lucideMapPin,
  lucidePencil,
  lucidePlus,
  lucideTrash2,
} from '@ng-icons/lucide';

@Component({
  selector: 'lc-map-marker-form-array',
  imports: [
    TranslocoDirective,
    MapMarkerConfigDialogComponent,
    HlmButton,
    ...HlmDialogImports,
    SanitizeHtmlPipe,
    NgIcon,
  ],
  templateUrl: './map-marker-form-array.component.html',
  styleUrl: './map-marker-form-array.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MapMarkerFormArrayComponent),
      multi: true,
    },
    { provide: TRANSLOCO_SCOPE, useValue: 'maps' },
    provideIcons({
      lucideAlignLeft,
      lucideMapPin,
      lucidePencil,
      lucidePlus,
      lucideTrash2,
    }),
  ],
  encapsulation: ViewEncapsulation.None,
})
export class MapMarkerFormArrayComponent implements ControlValueAccessor {
  @Input() disabledMarkerTypes: MapMarkerType[] = [];
  @Input() defaultMarkerType: MapMarkerType = null;

  public markers: MapMarker[] = [];
  public isDisabled = false;
  public descriptionMarker: MapMarker | null = null;

  private store = inject(Store);
  private cdr = inject(ChangeDetectorRef);

  writeValue(value: MapMarker[]): void {
    this.markers = value;
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  registerOnTouched(_fn: any): void {}

  propagateChange = (_: any) => {};

  onChange() {
    this.propagateChange(this.markers);
  }

  addMarker(marker: MapMarker) {
    this.markers.push(marker);
    this.onChange();
    this.store.dispatch(toastNotification('MAP_MARKER_ADDED'));
  }

  removeMarker(marker: MapMarker) {
    this.markers.splice(this.markers.indexOf(marker), 1);
    this.onChange();
    this.store.dispatch(toastNotification('MAP_MARKER_REMOVED'));
  }

  setDisabledState(isDisabled: boolean) {
    this.isDisabled = isDisabled;
    this.cdr.markForCheck();
  }

  showDescriptionDialog(event: Event, marker: MapMarker) {
    event.preventDefault();
    event.stopPropagation();
    this.descriptionMarker = marker;
  }

  closeDescription() {
    this.descriptionMarker = null;
  }
}
