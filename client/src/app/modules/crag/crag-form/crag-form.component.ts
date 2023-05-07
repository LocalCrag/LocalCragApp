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
import {ActivatedRoute, Router} from '@angular/router';
import {of} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ConfirmationService} from 'primeng/api';
import {TranslocoService} from '@ngneat/transloco';
import {marker} from '@ngneat/transloco-keys-manager/marker';

/**
 * A component for creating and editing crags.
 */
@Component({
  selector: 'lc-crag-form',
  templateUrl: './crag-form.component.html',
  styleUrls: ['./crag-form.component.scss'],
  providers: [ConfirmationService]
})
export class CragFormComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;

  public cragForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public crag: Crag;
  public editMode = false;

  constructor(private fb: FormBuilder,
              private store: Store,
              private route: ActivatedRoute,
              private router: Router,
              private cragsService: CragsService,
              private translocoService: TranslocoService,
              private confirmationService: ConfirmationService) {
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    const cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    if (cragSlug) {
      this.editMode = true;
      this.cragForm.disable();
      this.cragsService.getCrag(cragSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })).subscribe(crag => {
        this.crag = crag;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
      });
    } else {
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  /**
   * Builds the crag form.
   */
  private buildForm() {
    this.cragForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      shortDescription: [''],
      rules: [''],
    });
  }

  private setFormValue() {
    this.cragForm.patchValue({
      name: this.crag.name,
      description: this.crag.description,
      shortDescription: this.crag.shortDescription,
      rules: this.crag.rules,
    });
    this.cragForm.enable();
  }

  /**
   * Saves the crag and navigates to the crag list.
   */
  public saveCrag() {
    if (this.cragForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const crag = new Crag();
      crag.name = this.cragForm.get('name').value
      crag.description = this.cragForm.get('description').value
      crag.shortDescription = this.cragForm.get('shortDescription').value
      crag.rules = this.cragForm.get('rules').value
      if (this.crag) {
        crag.id = this.crag.id;
        this.cragsService.updateCrag(crag).subscribe(crag => {
          this.store.dispatch(toastNotification(NotificationIdentifier.CRAG_UPDATED));
          this.router.navigate(['/crags', crag.slug]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.cragsService.createCrag(crag, environment.regionId).subscribe(crag => {
          this.store.dispatch(toastNotification(NotificationIdentifier.CRAG_CREATED));
          this.router.navigate(['/crags']);
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the crag should really get deleted.
   * @param event Click event.
   */
  confirmDeleteCrag(event: Event) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('crag.askReallyWantToDeleteCrag')),
        acceptLabel: this.translocoService.translate(marker('crag.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('crag.noDontDelete')),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteCrag();
        },

      });
    });
  }

  /**
   * Deletes the crag and navigates to the crag list.
   */
  public deleteCrag() {
    this.cragsService.deleteCrag(this.crag).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.CRAG_DELETED));
      this.router.navigate(['/crags']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

}
