import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {FormDirective} from '../../shared/forms/form.directive';
import {LoadingState} from '../../../enums/loading-state';
import {CragsService} from '../../../services/crud/crags.service';
import {Crag} from '../../../models/crag';
import {environment} from '../../../../environments/environment';

@Component({
  selector: 'lc-crag-form',
  templateUrl: './crag-form.component.html',
  styleUrls: ['./crag-form.component.scss']
})
export class CragFormComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;

  public cragForm: FormGroup;
  public loadingState = LoadingState.DEFAULT;
  public loadingStates = LoadingState;

  constructor(private fb: FormBuilder,
              private cragsService: CragsService) {
  }

  ngOnInit() {
    this.buildForm();
  }

  /**
   * Builds the crag form.
   */
  private buildForm() {
    this.cragForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      rules: [''],
    });
  }

  public createCrag(){
    if (this.cragForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const crag = new Crag();
      crag.name = this.cragForm.get('name').value
      crag.description = this.cragForm.get('description').value
      crag.rules = this.cragForm.get('rules').value
      this.cragsService.createCrag(crag, environment.regionId).subscribe(crag => {
        console.log(crag);
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

}
