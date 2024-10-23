import { Injectable } from '@angular/core';
import { ControlGroupService } from './control-group.service';

/**
 * Service that manages a complete form. Provides functionality that is affecting the complete form.
 */
@Injectable({
  providedIn: 'root',
})
export class FormService {
  private controlGroupServices: ControlGroupService[] = [];

  /**
   * Adds a new ControlGroupService to the service's collection.
   *
   * @param controlGroupService
   */
  public addControlGroupService(controlGroupService: ControlGroupService) {
    this.controlGroupServices.push(controlGroupService);
  }

  /**
   * Marks all managed controls as touched.
   */
  public markAsTouched() {
    this.controlGroupServices.map((controlGroupService) => {
      controlGroupService.markAsTouched();
    });
  }
}
