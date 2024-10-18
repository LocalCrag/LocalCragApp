import { AbstractControl, FormControl } from '@angular/forms';
import { httpUrlValidator } from './http-url.validator';

describe('httpUrlValidator', () => {
  it('should accept correct URLs', () => {
    const correctUrlCtrl1 = new FormControl('https://localcrag.de');
    const correctUrlCtrl1ValidationResult1 =
      httpUrlValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toBeNull();

    const correctUrlCtrl2 = new FormControl('http://localcrag.de');
    const correctUrlCtrl1ValidationResult2 =
      httpUrlValidator()(correctUrlCtrl2);
    expect(correctUrlCtrl1ValidationResult2).toBeNull();
  });

  it('should not accept URLs without TLD', () => {
    const correctUrlCtrl1 = new FormControl('https://localcrag');
    const correctUrlCtrl1ValidationResult1 =
      httpUrlValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(
      jasmine.objectContaining({
        invalidHttpUrl: true,
      }),
    );

    const correctUrlCtrl2 = new FormControl('http://localcrag');
    const correctUrlCtrl1ValidationResult2 =
      httpUrlValidator()(correctUrlCtrl2);
    expect(correctUrlCtrl1ValidationResult2).toEqual(
      jasmine.objectContaining({
        invalidHttpUrl: true,
      }),
    );
  });

  it('should not accept arbitrary strings', () => {
    const correctUrlCtrl1 = new FormControl('lalala lol');
    const correctUrlCtrl1ValidationResult1 =
      httpUrlValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(
      jasmine.objectContaining({
        invalidHttpUrl: true,
      }),
    );
  });

  it('should not accept URLs without http(s)', () => {
    const correctUrlCtrl1 = new FormControl('localcrag.de');
    const correctUrlCtrl1ValidationResult1 =
      httpUrlValidator()(correctUrlCtrl1);
    expect(correctUrlCtrl1ValidationResult1).toEqual(
      jasmine.objectContaining({
        invalidHttpUrl: true,
      }),
    );
  });
});
