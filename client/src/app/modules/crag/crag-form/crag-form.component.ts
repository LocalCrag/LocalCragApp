import { Component, OnInit, QueryList, ViewChild, ViewChildren, } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { CragsService } from '../../../services/crud/crags.service';
import { Crag } from '../../../models/crag';
import { environment } from '../../../../environments/environment';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { TranslocoService } from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Title } from '@angular/platform-browser';
import { Editor } from 'primeng/editor';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { disabledMarkerTypesCrag, MapMarkerType, } from '../../../enums/map-marker-type';
import { ScalesService } from '../../../services/crud/scales.service';
import { LineType } from '../../../enums/line-type';

/**
 * A component for creating and editing crags.
 */
@Component({
  selector: 'lc-crag-form',
  templateUrl: './crag-form.component.html',
  styleUrls: ['./crag-form.component.scss'],
  providers: [ConfirmationService],
})
export class CragFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChildren(Editor) editors: QueryList<Editor>;

  public cragForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public crag: Crag;
  public editMode = false;
  public boulderScales: SelectItem<string | null>[] = null;
  public sportScales: SelectItem<string | null>[] = null;
  public tradScales: SelectItem<string | null>[] = null;
  public quillModules: any;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private title: Title,
    private uploadService: UploadService,
    private cragsService: CragsService,
    private translocoService: TranslocoService,
    private confirmationService: ConfirmationService,
    private scalesService: ScalesService,
  ) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    const scalesPopulated = this.scalesService.getScales().pipe(map(scales => {
      const boulderScales = [{label: this.translocoService.translate(marker("defaultScalesLabel")), value: null}];
      const sportScales = [{label: this.translocoService.translate(marker("defaultScalesLabel")), value: null}];
      const tradScales = [{label: this.translocoService.translate(marker("defaultScalesLabel")), value: null}];

      scales.forEach(scale => {
        switch (scale.lineType) {
          case LineType.BOULDER:
            boulderScales.push({label: scale.name, value: scale.name});
            break;
          case LineType.SPORT:
            sportScales.push({label: scale.name, value: scale.name});
            break;
          case LineType.TRAD:
            tradScales.push({label: scale.name, value: scale.name});
        }
      });

      this.boulderScales = boulderScales;
      this.sportScales = sportScales;
      this.tradScales = tradScales;

      return true;
    }));

    const cragSlug = this.route.snapshot.paramMap.get('crag-slug');

    if (cragSlug) {
      this.editMode = true;
      this.cragForm.disable();
      forkJoin([
        this.cragsService
          .getCrag(cragSlug)
          .pipe(
            catchError((e) => {
              if (e.status === 404) {
                this.router.navigate(['/not-found']);
              }
              return of(e);
            }),
          ),
        scalesPopulated,
      ]).subscribe(([crag, _]) => {
        this.crag = crag;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
        this.editors?.map((editor) => {
          editor.getQuill().enable();
        });
      });
    } else {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('cragFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.cragForm.disable();
      scalesPopulated.subscribe(() => {
        this.cragForm.enable();
        this.loadingState = LoadingState.DEFAULT;
      });
    }
  }

  /**
   * Builds the crag form.
   */
  private buildForm() {
    this.cragForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [''],
      shortDescription: [''],
      rules: [''],
      portraitImage: [null],
      secret: [false],
      mapMarkers: [[]],
      defaultBoulderScale: [null],
      defaultSportScale: [null],
      defaultTradScale: [null],
    });
  }

  /**
   * Sets the form value based on an input crag and enables the form afterwards.
   */
  private setFormValue() {
    this.cragForm.enable();
    this.cragForm.patchValue({
      name: this.crag.name,
      description: this.crag.description,
      shortDescription: this.crag.shortDescription,
      rules: this.crag.rules,
      portraitImage: this.crag.portraitImage,
      secret: this.crag.secret,
      mapMarkers: this.crag.mapMarkers,
      defaultBoulderScale: this.crag.defaultBoulderScale,
      defaultSportScale: this.crag.defaultSportScale,
      defaultTradScale: this.crag.defaultTradScale,
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.crag) {
      this.router.navigate(['/topo', this.crag.slug]);
    } else {
      this.router.navigate(['/topo']);
    }
  }

  /**
   * Saves the crag and navigates to the crag list.
   */
  public saveCrag() {
    if (this.cragForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const crag = new Crag();
      crag.name = this.cragForm.get('name').value;
      crag.description = this.cragForm.get('description').value;
      crag.shortDescription = this.cragForm.get('shortDescription').value;
      crag.rules = this.cragForm.get('rules').value;
      crag.portraitImage = this.cragForm.get('portraitImage').value;
      crag.secret = this.cragForm.get('secret').value;
      crag.mapMarkers = this.cragForm.get('mapMarkers').value;
      crag.defaultBoulderScale = this.cragForm.get('defaultBoulderScale').value;
      crag.defaultSportScale = this.cragForm.get('defaultSportScale').value;
      crag.defaultTradScale = this.cragForm.get('defaultTradScale').value;
      if (this.crag) {
        crag.slug = this.crag.slug;
        this.cragsService.updateCrag(crag).subscribe((crag) => {
          this.store.dispatch(
            toastNotification(NotificationIdentifier.CRAG_UPDATED),
          );
          this.router.navigate(['/topo', crag.slug]);
          this.loadingState = LoadingState.DEFAULT;
        });
      } else {
        this.cragsService.createCrag(crag).subscribe(() => {
          this.store.dispatch(
            toastNotification(NotificationIdentifier.CRAG_CREATED),
          );
          this.router.navigate(['/topo']);
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
        message: this.translocoService.translate(
          marker('crag.askReallyWantToDeleteCrag'),
        ),
        acceptLabel: this.translocoService.translate(marker('crag.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('crag.noDontDelete'),
        ),
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
      this.store.dispatch(
        toastNotification(NotificationIdentifier.CRAG_DELETED),
      );
      this.router.navigate(['/topo']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected readonly disabledMarkerTypesCrag = disabledMarkerTypesCrag;
  protected readonly MapMarkerType = MapMarkerType;
  protected readonly environment = environment;
}
