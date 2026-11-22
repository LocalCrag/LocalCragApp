import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
  ChangeDetectionStrategy,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { FormDirective } from '../../shared/forms/form.directive';
import { LoadingState } from '../../../enums/loading-state';
import { CragsService } from '../../../services/crud/crags.service';
import { Crag } from '../../../models/crag';
import { environment } from '../../../../environments/environment';
import { Store } from '@ngrx/store';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY, Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { Title } from '@angular/platform-browser';
import { WysiwygEditorComponent } from '../../shared/components/wysiwyg-editor/wysiwyg-editor.component';
import { UploadService } from '../../../services/crud/upload.service';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import {
  disabledMarkerTypesCrag,
  MapMarkerType,
} from '../../../enums/map-marker-type';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { MapMarkerFormArrayComponent } from '../../maps/map-marker-form-array/map-marker-form-array.component';
import { SingleImageUploadComponent } from '../../shared/forms/controls/single-image-upload/single-image-upload.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { condicasterCragIdValidator } from '../../../utility/validators/condicaster.validators';
import { LanguageService } from '../../../services/core/language.service';
import { CondicasterEnabledDirective } from '../../shared/directives/condicaster-enabled.directive';
import { OutdoorModeDirective } from '../../shared/directives/outdoor-mode.directive';
import { ScheduledClosureFormComponent } from '../../shared/components/scheduled-closure-form/scheduled-closure-form.component';
import { PageTitleService } from '../../../services/core/page-title.service';
import { DuplicateNameWarningComponent } from '../../shared/components/duplicate-name-warning/duplicate-name-warning.component';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmCheckbox } from '@spartan-ng/helm/checkbox';
import { HlmTooltip } from '@spartan-ng/helm/tooltip';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBan,
  lucideCircleQuestionMark,
  lucideSave,
  lucideTrash2,
} from '@ng-icons/lucide';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { LoadingButtonComponent } from '../../shared/components/loading-button/loading-button.component';
import {
  CondicasterCragLink,
  CondicasterCragLinkComponent,
} from '../../shared/components/condicaster-crag-link/condicaster-crag-link.component';
import { Coordinates } from '../../../interfaces/coordinates.interface';

/**
 * A component for creating and editing crags.
 */
@Component({
  selector: 'lc-crag-form',
  templateUrl: './crag-form.component.html',
  styleUrls: ['./crag-form.component.scss'],
  providers: [
    provideIcons({
      lucideBan,
      lucideCircleQuestionMark,
      lucideSave,
      lucideTrash2,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    LoadingButtonComponent,
    TranslocoDirective,
    ReactiveFormsModule,
    ControlGroupDirective,
    FormDirective,
    FormControlDirective,
    IfErrorDirective,
    WysiwygEditorComponent,
    MapMarkerFormArrayComponent,
    TranslocoPipe,
    SingleImageUploadComponent,
    OutdoorModeDirective,
    CondicasterEnabledDirective,
    ScheduledClosureFormComponent,
    DuplicateNameWarningComponent,
    CondicasterCragLinkComponent,
    HlmButton,
    HlmInput,
    HlmCheckbox,
    HlmTooltip,
    NgIcon,
  ],
})
export class CragFormComponent implements OnInit {
  private confirmDialog = inject(ConfirmDialogService);
  @ViewChild(FormDirective) formDirective: FormDirective;

  public cragForm: FormGroup;
  public loadingState = LoadingState.INITIAL_LOADING;
  public loadingStates = LoadingState;
  public crag: Crag;
  public editMode = false;

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(Title);
  private uploadService = inject(UploadService);
  private cragsService = inject(CragsService);
  private translocoService = inject(TranslocoService);
  private languageService = inject(LanguageService);
  private pageTitleService = inject(PageTitleService);

  public findCragsByName = (
    name: string,
    excludeId: string | null = null,
  ): Observable<Crag[]> => this.cragsService.findByName(name, excludeId);

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();

    this.languageService.renderedLanguage$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rendered) => {
        if (!rendered) return;
        this.setPageTitle();
      });

    const cragSlug = this.route.snapshot.paramMap.get('crag-slug');

    if (cragSlug) {
      this.editMode = true;
      this.setPageTitle();
      this.cragForm.disable();
      this.cragsService
        .getCrag(cragSlug)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
              return EMPTY;
            }
            return throwError(() => e);
          }),
        )
        .subscribe((crag) => {
          this.crag = crag;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        });
    } else {
      this.setPageTitle();
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('cragFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  /** t(crag.cragForm.editCragTitle, crag.cragForm.createCragTitle) */
  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? 'crag.cragForm.editCragTitle'
          : 'crag.cragForm.createCragTitle',
      ),
    );
  }

  /**
   * Builds the crag form.
   */
  private buildForm() {
    this.cragForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(120)]],
      description: [null],
      shortDescription: [null],
      rules: [null],
      rulesTitle: [null, [Validators.maxLength(255)]],
      portraitImage: [null],
      secret: [false],
      mapMarkers: [[]],
      condicasterCragId: [null, [condicasterCragIdValidator]],
      condicasterCragName: [null],
      closureSchedules: [[]],
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
      rulesTitle: this.crag.rulesTitle,
      portraitImage: this.crag.portraitImage,
      secret: this.crag.secret,
      mapMarkers: this.crag.mapMarkers,
      condicasterCragId: this.crag.condicasterCragId,
      condicasterCragName: this.crag.condicasterCragName,
      closureSchedules: this.crag.closureSchedules ?? [],
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    if (this.crag) {
      this.router.navigate(['/topo', this.crag.slug]);
    } else {
      this.router.navigate(['/topo/crags']);
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
      crag.rulesTitle = this.cragForm.get('rulesTitle').value || null;
      crag.portraitImage = this.cragForm.get('portraitImage').value;
      crag.secret = this.cragForm.get('secret').value;
      crag.mapMarkers = this.cragForm.get('mapMarkers').value;
      crag.closureSchedules = this.cragForm.get('closureSchedules').value ?? [];
      const condicasterCragId = this.cragForm.get('condicasterCragId').value;
      crag.condicasterCragId =
        condicasterCragId === null || condicasterCragId === ''
          ? null
          : Number(condicasterCragId);
      crag.condicasterCragName = crag.condicasterCragId
        ? this.cragForm.get('condicasterCragName').value || null
        : null;
      if (this.crag) {
        crag.slug = this.crag.slug;
        this.uploadService
          .saveFileFocusIfChanged(crag.portraitImage)
          .pipe(switchMap(() => this.cragsService.updateCrag(crag)))
          .subscribe((crag) => {
            this.store.dispatch(toastNotification('CRAG_UPDATED'));
            this.router.navigate(['/topo', crag.slug]);
            this.loadingState = LoadingState.DEFAULT;
          });
      } else {
        this.uploadService
          .saveFileFocusIfChanged(crag.portraitImage)
          .pipe(switchMap(() => this.cragsService.createCrag(crag)))
          .subscribe(() => {
            this.store.dispatch(toastNotification('CRAG_CREATED'));
            this.router.navigate(['/topo/crags']);
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
  confirmDeleteCrag(_event: Event) {
    this.confirmDialog.open({
      message: this.translocoService.translate(
        marker('crag.askReallyWantToDeleteCrag'),
      ),
      acceptLabel: this.translocoService.translate(marker('crag.yesDelete')),
      rejectLabel: this.translocoService.translate(marker('crag.noDontDelete')),
      accept: () => {
        this.deleteCrag();
      },
      destructive: true,
    });
  }

  /**
   * Deletes the crag and navigates to the crag list.
   */
  public deleteCrag() {
    this.cragsService.deleteCrag(this.crag).subscribe(() => {
      this.store.dispatch(toastNotification('CRAG_DELETED'));
      this.router.navigate(['/topo']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

  protected markerCoordinates(): Coordinates | null {
    const markers = this.cragForm?.get('mapMarkers')?.value as
      { coordinates?: Coordinates }[] | null;
    return markers?.find((marker) => marker?.coordinates)?.coordinates ?? null;
  }

  protected setCondicasterCrag(link: CondicasterCragLink | null): void {
    this.cragForm.patchValue({
      condicasterCragId: link?.cragId ?? null,
      condicasterCragName: link?.name ?? null,
    });
  }

  protected readonly disabledMarkerTypesCrag = disabledMarkerTypesCrag;
  protected readonly MapMarkerType = MapMarkerType;
  protected readonly environment = environment;
}
