import {Component, OnInit, ViewChild} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslocoService} from '@ngneat/transloco';
import {ConfirmationService} from 'primeng/api';
import {catchError} from 'rxjs/operators';
import {of} from 'rxjs';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {environment} from '../../../../environments/environment';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {Sector} from '../../../models/sector';
import {SectorsService} from '../../../services/crud/sectors.service';

/**
 * Form component for creating and editing sectors.
 */
@Component({
  selector: 'lc-sector-form',
  templateUrl: './sector-form.component.html',
  styleUrls: ['./sector-form.component.scss'],
  providers: [ConfirmationService]
})
export class SectorFormComponent implements OnInit {

  @ViewChild(FormDirective) formDirective: FormDirective;

  public sectorForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public sector: Sector;
  public editMode = false;

  private cragSlug: string;

  constructor(private fb: FormBuilder,
              private store: Store,
              private route: ActivatedRoute,
              private router: Router,
              private sectorsService: SectorsService,
              private translocoService: TranslocoService,
              private confirmationService: ConfirmationService) {
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    this.cragSlug = this.route.snapshot.paramMap.get('crag-slug');
    const sectorSlug = this.route.snapshot.paramMap.get('sector-slug');
    if (this.cragSlug && sectorSlug) {
      this.editMode = true;
      this.sectorForm.disable();
      this.sectorsService.getSector(this.cragSlug, sectorSlug).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      })).subscribe(sector => {
        this.sector = sector;
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
    this.sectorForm = this.fb.group({
      name: ['', [Validators.required]],
      description: [''],
      shortDescription: [''],
      portraitImage: [null]
    });
  }

  /**
   * Sets the form value based on an input sector and enables the form afterwards.
   */
  private setFormValue() {
    this.sectorForm.patchValue({
      name: this.sector.name,
      description: this.sector.description,
      shortDescription: this.sector.shortDescription,
      portraitImage: this.sector.portraitImage,
    });
    this.sectorForm.enable();
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.sector) {
      this.router.navigate(['/crags', this.cragSlug, 'sectors', this.sector.slug]);
    } else {
      this.router.navigate(['/crags', this.cragSlug, 'sectors']);
    }
  }

  /**
   * Saves the sector and navigates to the sector list.
   */
  public saveCrag() {
    if (this.sectorForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const sector = new Sector;
      sector.name = this.sectorForm.get('name').value
      sector.description = this.sectorForm.get('description').value
      sector.shortDescription = this.sectorForm.get('shortDescription').value
      sector.portraitImage = this.sectorForm.get('portraitImage').value
      if (this.sector) {
        sector.id = this.sector.id;
        this.sectorsService.updateSector(this.cragSlug, sector).subscribe(sector => {
          this.store.dispatch(toastNotification(NotificationIdentifier.SECTOR_UPDATED));
          this.router.navigate(['/crags', this.cragSlug, 'sectors', sector.slug]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.sectorsService.createSector(sector, this.cragSlug).subscribe(sector => {
          this.store.dispatch(toastNotification(NotificationIdentifier.SECTOR_CREATED));
          this.router.navigate(['/crags', this.cragSlug, 'sectors']);
          this.loadingState = LoadingState.DEFAULT;
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the sector should really get deleted.
   * @param event Click event.
   */
  confirmDeleteSector(event: Event) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('sector.askReallyWantToDeleteSector')),
        acceptLabel: this.translocoService.translate(marker('sector.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('sector.noDontDelete')),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteSector();
        },
      });
    });
  }

  /**
   * Deletes the sector and navigates to the sector list.
   */
  public deleteSector() {
    this.sectorsService.deleteSector(this.cragSlug, this.sector).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.SECTOR_DELETED));
      this.router.navigate(['/crags', this.cragSlug, 'sectors']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

}
