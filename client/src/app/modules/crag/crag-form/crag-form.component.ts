import {Component, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {FormDirective} from '../../shared/forms/form.directive';
import {LoadingState} from '../../../enums/loading-state';
import {CragsService} from '../../../services/crud/crags.service';
import {Crag} from '../../../models/crag';
import {environment} from '../../../../environments/environment';
import {Store} from '@ngrx/store';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {Router} from '@angular/router';

/**
 * A component for creating crags.
 */
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
              private store: Store,
              private router: Router,
              private cragsService: CragsService) {
  }

  /**
   * Builds the form on component initialization.
   */
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

  /**
   * Creates the crag and navigates to the crag list.
   */
  public createCrag() {
    if (this.cragForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const crag = new Crag();
      crag.name = this.cragForm.get('name').value
      crag.description = this.cragForm.get('description').value
      crag.rules = this.cragForm.get('rules').value
      this.cragsService.createCrag(crag, environment.regionId).subscribe(crag => {
        this.store.dispatch(toastNotification(NotificationIdentifier.CRAG_CREATED));
        this.router.navigate(['/crags']);
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.formDirective.markAsTouched();
    }
  }

}
