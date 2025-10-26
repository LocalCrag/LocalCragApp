import { Directive, inject } from '@angular/core';
import { FormService } from './form.service';

/**
 * Directive that wraps a form. Offers functionality to mark all the forms controls as touched.
 */
@Directive({
  selector: '[lcForm]',
  providers: [FormService],
})
export class FormDirective {
  private formService = inject(FormService);

  /**
   * Marks all registered controls as touched.
   */
  markAsTouched() {
    this.formService.markAsTouched();
  }
}
