import {AbstractControl, FormControl} from '@angular/forms';
import {lngValidator} from './lng.validator';

describe('lngValidator', () => {

  it('should accept correct latitude value', () => {
    const correctUrlCtrl1 = new FormControl('140.37606632952576');
    const correctUrlCtrl1ValidationResult1 = lngValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toBeNull();
  });

  it('should not accept values greater than 180', () => {
    const correctUrlCtrl1 = new FormControl('180.37606632952576');
    const correctUrlCtrl1ValidationResult1 = lngValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(jasmine.objectContaining({
      invalidLng: true
    }))
  });

  it('should not accept values smaller than -180', () => {
    const correctUrlCtrl1 = new FormControl('-180.37606632952576');
    const correctUrlCtrl1ValidationResult1 = lngValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(jasmine.objectContaining({
      invalidLng: true
    }))
  });

  it('should not accept values that are no numbers', () => {
    const correctUrlCtrl1 = new FormControl('Test');
    const correctUrlCtrl1ValidationResult1 = lngValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(jasmine.objectContaining({
      invalidLng: true
    }))
  });

});
