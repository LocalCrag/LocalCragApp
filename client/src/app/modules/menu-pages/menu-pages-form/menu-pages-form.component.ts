import { Component, OnInit, ViewChild } from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import { Editor, EditorModule } from 'primeng/editor';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { Post } from '../../../models/post';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { PostsService } from '../../../services/crud/posts.service';
import { UploadService } from '../../../services/crud/upload.service';
import { Title } from '@angular/platform-browser';
import { TranslocoDirective, TranslocoService } from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { environment } from '../../../../environments/environment';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { NotificationIdentifier } from '../../../utility/notifications/notification-identifier.enum';
import { MenuPage } from '../../../models/menu-page';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { InputTextModule } from 'primeng/inputtext';
import { NgIf } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { SharedModule } from '../../shared/shared.module';
import { reloadMenus } from '../../../ngrx/actions/core.actions';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';

@Component({
  selector: 'lc-menu-pages-form',
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    ConfirmPopupModule,
    EditorModule,
    InputTextModule,
    NgIf,
    PaginatorModule,
    ReactiveFormsModule,
    SharedModule,
    TranslocoDirective,
  ],
  templateUrl: './menu-pages-form.component.html',
  styleUrl: './menu-pages-form.component.scss',
  providers: [ConfirmationService],
})
export class MenuPagesFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;
  @ViewChild(Editor) editor: Editor;

  public menuPageForm: FormGroup;
  public loadingState = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public menuPage: MenuPage;
  public editMode = false;
  public quillModules: any;

  constructor(
    private fb: FormBuilder,
    private store: Store,
    private route: ActivatedRoute,
    private router: Router,
    private menuPagesService: MenuPagesService,
    private uploadService: UploadService,
    private title: Title,
    private translocoService: TranslocoService,
    private confirmationService: ConfirmationService,
  ) {
    this.quillModules = this.uploadService.getQuillFileUploadModules();
  }

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
      this.menuPageForm.disable();
      this.menuPagesService
        .getMenuPage(menuPageSlug)
        .pipe(
          catchError((e) => {
            if (e.status === 404) {
              this.router.navigate(['/not-found']);
            }
            return of(e);
          }),
        )
        .subscribe((menuPage) => {
          this.menuPage = menuPage;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
          if (this.editor) {
            this.editor.getQuill().enable();
          }
        });
    } else {
      this.store.select(selectInstanceName).subscribe((instanceName) => {
        this.title.setTitle(
          `${this.translocoService.translate(marker('menuPageFormBrowserTitle'))} - ${instanceName}`,
        );
      });
      this.loadingState = LoadingState.DEFAULT;
    }
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
        this.menuPagesService.updateMenuPage(menuPage).subscribe((post) => {
          this.store.dispatch(
            toastNotification(NotificationIdentifier.MENU_PAGE_UPDATED),
          );
          this.router.navigate(['/pages']);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(reloadMenus());
        });
      } else {
        this.menuPagesService.createMenuPage(menuPage).subscribe((post) => {
          this.store.dispatch(
            toastNotification(NotificationIdentifier.MENU_PAGE_CREATED),
          );
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
  confirmDeleteMenuPage(event: Event) {
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(
          marker('menuPages.askReallyWantToDeleteMenuPage'),
        ),
        acceptLabel: this.translocoService.translate(
          marker('menuPages.yesDelete'),
        ),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(
          marker('menuPages.noDontDelete'),
        ),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteMenuPage();
        },
      });
    });
  }

  /**
   * Deletes the menu page and navigates to the menu pages list.
   */
  public deleteMenuPage() {
    this.menuPagesService.deleteMenuPage(this.menuPage).subscribe(() => {
      this.store.dispatch(
        toastNotification(NotificationIdentifier.MENU_PAGE_DELETED),
      );
      this.store.dispatch(reloadMenus());
      this.router.navigate(['/pages']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }
}
