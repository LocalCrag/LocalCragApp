import {Directive, HostBinding} from '@angular/core';
import {ControlGroupService} from './control-group.service';

/**
 * Directive that provides the ControlGroupService for a control group.
 * A control group in this sense are a number of form controls that share the same block for error and info
 * control messages. In most cases this is just a single input, but it can also be an input group (value + unit).
 *
 * The directive sets the error class on its host element for convenient application of css rules for error indication.
 */
@Directive({
  selector: '[lcControlGroup]',
  providers: [ControlGroupService],
})
export class ControlGroupDirective {
  @HostBinding('class.error') hasError = false;
  @HostBinding('class.disabled') isDisabled = false;
  @HostBinding('class.lc-control-group') lcControlGroup = true;

  constructor(private controlGroupService: ControlGroupService) {
    this.controlGroupService.hasErrorAndIsTouched().subscribe((hasError) => {
      this.hasError = hasError;
    });
    this.controlGroupService.isDisabled().subscribe((isDisabled) => {
      this.isDisabled = isDisabled;
    });
  }
}
