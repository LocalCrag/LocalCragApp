import {
  Component,
  OnInit,
  ViewChild,
  inject,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { WysiwygEditorComponent } from '../../shared/components/wysiwyg-editor/wysiwyg-editor.component';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError } from 'rxjs/operators';
import { EMPTY, throwError } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { MenuPage } from '../../../models/menu-page';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';

import { reloadMenus } from '../../../ngrx/actions/core.actions';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { PageTitleService } from '../../../services/core/page-title.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmSpinner } from '@spartan-ng/helm/spinner';
import { NgIcon } from '@ng-icons/core';
import { provideIcons } from '@ng-icons/core';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { lucideBan, lucideSave, lucideTrash2 } from '@ng-icons/lucide';

@Component({
  selector: 'lc-menu-pages-form',
  imports: [
    WysiwygEditorComponent,
    ReactiveFormsModule,
    TranslocoDirective,
    TranslocoPipe,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
    HlmButton,
    HlmInput,
    HlmSpinner,
    NgIcon,
  ],
  templateUrl: './menu-pages-form.component.html',
  styleUrl: './menu-pages-form.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  providers: [provideIcons({ lucideBan, lucideSave, lucideTrash2 })],
})
export class MenuPagesFormComponent implements OnInit {
  private confirmDialog = inject(ConfirmDialogService);
  @ViewChild(FormDirective) formDirective: FormDirective;

  public menuPageForm: FormGroup;
  public loadingState = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public menuPage: MenuPage;
  public editMode = false;

  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuPagesService = inject(MenuPagesService);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private pageTitleService = inject(PageTitleService);

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    this.buildForm();
    const menuPageSlug = this.route.snapshot.paramMap.get('menu-page-slug');
    if (menuPageSlug) {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('editMenuPageFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.editMode = true;
      this.setPageTitle();
      this.menuPageForm.disable();
      this.menuPagesService
        .getMenuPage(menuPageSlug)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
              return EMPTY;
            }
            return throwError(() => e);
          }),
        )
        .subscribe((menuPage) => {
          this.menuPage = menuPage;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        });
    } else {
      this.setPageTitle();
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('menuPageFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.loadingState = LoadingState.DEFAULT;
    }
  }

  private setPageTitle(): void {
    this.pageTitleService.setTitle(
      this.translocoService.translate(
        this.editMode
          ? marker('menuPages.menuPageForm.editMenuPageTitle')
          : marker('menuPages.menuPageForm.createMenuPageTitle'),
      ),
    );
  }

  /**
   * Builds the menu page form.
   */
  private buildForm() {
    this.menuPageForm = this.fb.group({
      title: [null, [Validators.required, Validators.maxLength(120)]],
      text: [null, [Validators.required]],
    });
  }

  /**
   * Sets the form value based on an input sector and enables the form afterward.
   */
  private setFormValue() {
    this.menuPageForm.enable();
    this.menuPageForm.patchValue({
      title: this.menuPage.title,
      text: this.menuPage.text,
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    this.router.navigate(['/pages']);
  }

  /**
   * Saves the menu page and navigates to the menu page list.
   */
  public saveMenuPage() {
    if (this.menuPageForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const menuPage = new MenuPage();
      menuPage.title = this.menuPageForm.get('title').value;
      menuPage.text = this.menuPageForm.get('text').value;
      if (this.menuPage) {
        menuPage.slug = this.menuPage.slug;
        this.menuPagesService.updateMenuPage(menuPage).subscribe(() => {
          this.store.dispatch(toastNotification('MENU_PAGE_UPDATED'));
          this.router.navigate(['/pages']);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(reloadMenus());
        });
      } else {
        this.menuPagesService.createMenuPage(menuPage).subscribe(() => {
          this.store.dispatch(toastNotification('MENU_PAGE_CREATED'));
          this.router.navigate(['/pages']);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(reloadMenus());
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the menu page should really get deleted.
   * @param event Click event.
   */
  confirmDeleteMenuPage(_event: Event) {
    this.confirmDialog.open({
      message: this.translocoService.translate(
        marker('menuPages.askReallyWantToDeleteMenuPage'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('menuPages.yesDelete'),
      ),
      rejectLabel: this.translocoService.translate(
        marker('menuPages.noDontDelete'),
      ),
      destructive: true,
      accept: () => {
        this.deleteMenuPage();
      },
    });
  }

  /**
   * Deletes the menu page and navigates to the menu pages list.
   */
  public deleteMenuPage() {
    this.menuPagesService.deleteMenuPage(this.menuPage).subscribe(() => {
      this.store.dispatch(toastNotification('MENU_PAGE_DELETED'));
      this.store.dispatch(reloadMenus());
      this.router.navigate(['/pages']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }
}
