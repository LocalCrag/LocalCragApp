import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export function createGeneralFormGroup(fb: FormBuilder): FormGroup {
  return fb.group({
    instanceName: [null, [Validators.required, Validators.maxLength(120)]],
    copyrightOwner: [null, [Validators.required, Validators.maxLength(120)]],
    mailGreeting: [null, [Validators.required, Validators.maxLength(120)]],
    gymMode: [null],
    skippedHierarchicalLayers: [null],
    displayUserGrades: [null],
    displayUserRatings: [null],
    noClosedProjects: [null],
    faDefaultFormat: [null],
    defaultStartingPosition: [null, [Validators.required]],
    rankingPastWeeks: [null],
    language: [null],
    timezone: [null, [Validators.required]],
  });
}
