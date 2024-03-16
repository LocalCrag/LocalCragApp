import {AfterViewInit, Component, forwardRef, Injector, OnInit, Self, ViewChild} from '@angular/core';
import {
  ControlValueAccessor, FormBuilder, FormControl,
  FormGroup,
  NG_VALUE_ACCESSOR,
  NgControl,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import {GPS} from '../../../../../interfaces/gps.interface';
import {TranslocoDirective} from '@ngneat/transloco';
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
  selector: 'lc-gps',
  standalone: true,
  imports: [
    TranslocoDirective,
    SharedModule,
    InputTextModule,
    ReactiveFormsModule,
    ButtonModule,
    MessageModule,
    NgIf
  ],
  templateUrl: './gps.component.html',
  styleUrl: './gps.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => GpsComponent),
      multi: true,
    }
  ],
})
@UntilDestroy()
export class GpsComponent implements OnInit, ControlValueAccessor, AfterViewInit {

  @ViewChild(FormDirective) formDirective: FormDirective;

  public formControl: NgControl;
  public isDisabled = false;
  public gpsForm: FormGroup;
  public positionLoading = false;
  public accuracy: number;
  public gpsLoadingSuccess = false;
  public gpsLoadingError = false;

  private gps: GPS;

  constructor(private fb: FormBuilder,
              private inj: Injector) {
  }

  private buildForm() {
    this.gpsForm = this.fb.group({
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
    this.gpsForm.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.onChange();
    })
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
   * @param gps GPS value to write.
   */
  writeValue(gps: GPS): void {
    this.gps = gps;
    this.gpsForm.patchValue({
      lat: gps?.lat || null,
      lng: gps?.lng || null,
    })
    if(this.gpsForm.invalid){
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Not implemented but needed for the interface.
   */
  registerOnTouched(_fn: any): void {
  }

  /**
   * Function is replaced in registerOnChange.
   */
  propagateChange = (_: any) => {
  };

  validate() {
    return this.gpsForm.invalid ? {
      invalid: true
    } : null;
  }

  /**
   * Emits internal value when it changes.
   */
  onChange() {
    if (this.gpsForm.valid && this.gpsForm.get('lat').value && this.gpsForm.get('lng').value) {
      this.gps = {
        lat: Number(this.gpsForm.get('lat').value),
        lng: Number(this.gpsForm.get('lng').value)
      }
    } else {
      this.gps = null;
    }
    this.propagateChange(this.gps);
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
    this.gpsLoadingSuccess = false;
    this.gpsLoadingError = false;
    this.accuracy = null;
    if (navigator.geolocation) {
      this.positionLoading = true;
      this.gpsForm.disable();
      navigator.geolocation.getCurrentPosition((position) => {
        this.gpsForm.get('lat').setValue(position.coords.latitude);
        this.gpsForm.get('lng').setValue(position.coords.longitude);
        this.accuracy = position.coords.accuracy;
        this.positionLoading = false;
        this.gpsForm.enable();
        this.onChange();
        this.gpsLoadingSuccess = true;
      }, () => {
        this.gpsLoadingError = true;
        this.positionLoading = false;
      });
    } else {
      this.gpsLoadingError = true;
    }
  }

}
