import {AfterViewInit, Component, forwardRef, Injector, OnInit, ViewChild,} from '@angular/core';
import {
  ControlValueAccessor,
  FormBuilder,
  FormGroup,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
} from '@angular/forms';
import {Coordinates} from '../../../../../interfaces/coordinates.interface';
import {TranslocoDirective} from '@jsverse/transloco';
import {SharedModule} from '../../../shared.module';
import {InputTextModule} from 'primeng/inputtext';
import {latValidator} from '../../../../../utility/validators/lat.validator';
import {lngValidator} from '../../../../../utility/validators/lng.validator';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {FormDirective} from '../../form.directive';
import {ButtonModule} from 'primeng/button';
import {MessageModule} from 'primeng/message';
import {NgIf} from '@angular/common';

@Component({
  selector: 'lc-coordinates',
  standalone: true,
  imports: [
    TranslocoDirective,
    SharedModule,
    InputTextModule,
    ReactiveFormsModule,
    ButtonModule,
    MessageModule,
    NgIf,
  ],
  templateUrl: './coordinates.component.html',
  styleUrl: './coordinates.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CoordinatesComponent),
      multi: true,
    },
  ],
})
@UntilDestroy()
export class CoordinatesComponent
  implements OnInit, ControlValueAccessor, AfterViewInit
{
  @ViewChild(FormDirective) formDirective: FormDirective;

  public formControl: NgControl;
  public isDisabled = false;
  public coordinatesForm: FormGroup;
  public positionLoading = false;
  public accuracy: number;
  public coordinatesLoadingSuccess = false;
  public coordinatesLoadingError = false;

  private coordinates: Coordinates;
  private fetchFinishTime: number;

  constructor(
    private fb: FormBuilder,
    private inj: Injector,
  ) {}

  private buildForm() {
    this.coordinatesForm = this.fb.group({
      lat: [null, [latValidator()]],
      lng: [null, [lngValidator()]],
    });
  }

  /**
   * Initializes the uploader component.
   */
  ngOnInit() {
    this.formControl = this.inj.get(NgControl);
    this.buildForm();
    this.coordinatesForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.onChange();
      });
  }

  ngAfterViewInit() {
    this.formControl.control.setValidators([this.validate.bind(this)]);
    this.formControl.control.updateValueAndValidity();
  }

  /**
   * Registers the onChange method for the ControlValueAccessor.
   *
   * @param fn Function to call on change.
   */
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }

  /**
   * Used by the formControl to write a value to the native formControl or any custom value.
   *
   * @param coordinates Coordinates value to write.
   */
  writeValue(coordinates: Coordinates): void {
    this.coordinates = coordinates;
    this.coordinatesForm.patchValue({
      lat: coordinates?.lat || null,
      lng: coordinates?.lng || null,
    });
    if (this.coordinatesForm.invalid) {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Not implemented but needed for the interface.
   */
  registerOnTouched(_fn: any): void {}

  /**
   * Function is replaced in registerOnChange.
   */
  propagateChange = (_: any) => {};

  validate() {
    return this.coordinatesForm.invalid
      ? {
          invalid: true,
        }
      : null;
  }

  /**
   * Emits internal value when it changes.
   */
  onChange() {
    if (
      this.coordinatesForm.valid &&
      this.coordinatesForm.get('lat').value &&
      this.coordinatesForm.get('lng').value
    ) {
      this.coordinates = {
        lat: Number(this.coordinatesForm.get('lat').value),
        lng: Number(this.coordinatesForm.get('lng').value),
      };
    } else {
      this.coordinates = null;
    }
    this.propagateChange(this.coordinates);
  }

  /**
   * Sets the disabled state of the component.
   *
   * @param isDisabled Disabled state.
   */
  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  getGeoLocation() {
    this.coordinatesForm.get('lat').setValue(null);
    this.coordinatesForm.get('lng').setValue(null);
    this.coordinatesLoadingSuccess = false;
    this.coordinatesLoadingError = false;
    this.accuracy = null;
    if (navigator.geolocation) {
      this.positionLoading = true;
      this.coordinatesForm.disable();
      this.fetchFinishTime = Date.now() + 30000;
      this.fetchGeoLocationLoop();
    } else {
      this.coordinatesLoadingError = true;
    }
  }

  private fetchGeoLocationLoop() {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (
          !this.accuracy ||
          Math.round(position.coords.accuracy) < this.accuracy
        ) {
          this.coordinatesForm.get('lat').setValue(position.coords.latitude);
          this.coordinatesForm.get('lng').setValue(position.coords.longitude);
          this.accuracy = Math.round(position.coords.accuracy);
        }
        this.coordinatesLoadingSuccess = true;
        if (Date.now() < this.fetchFinishTime && this.accuracy > 5) {
          this.fetchGeoLocationLoop();
        } else {
          this.finishFetchingGeoLocation();
        }
      },
      () => {
        if (this.coordinatesLoadingSuccess) {
          // If we already have a position, errors don't matter
          this.finishFetchingGeoLocation();
        } else {
          this.coordinatesLoadingError = true;
          this.positionLoading = false;
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      },
    );
  }

  private finishFetchingGeoLocation() {
    this.positionLoading = false;
    this.coordinatesForm.enable();
    this.onChange();
  }
}
