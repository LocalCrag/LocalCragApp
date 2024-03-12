import {createCachedSource} from '../../services/core/cache.service';
import {AbstractControl, FormControl} from '@angular/forms';
import {httpUrlValidator} from './http-url.validator';
import {latValidator} from './lat.validator';

describe('latValidator', () => {

  it('should accept correct latitude value', () => {
    const correctUrlCtrl1 = new FormControl('50.37606632952576');
    const correctUrlCtrl1ValidationResult1 = latValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toBeNull();
  });

  it('should not accept values greater than 90', () => {
    const correctUrlCtrl1 = new FormControl('90.37606632952576');
    const correctUrlCtrl1ValidationResult1 = latValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(jasmine.objectContaining({
      invalidLat: true
    }))
  });

  it('should not accept values smaller than -90', () => {
    const correctUrlCtrl1 = new FormControl('-90.37606632952576');
    const correctUrlCtrl1ValidationResult1 = latValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(jasmine.objectContaining({
      invalidLat: true
    }))
  });

  it('should not accept values that are no numbers', () => {
    const correctUrlCtrl1 = new FormControl('Test');
    const correctUrlCtrl1ValidationResult1 = latValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(jasmine.objectContaining({
      invalidLat: true
    }))
  });

});
