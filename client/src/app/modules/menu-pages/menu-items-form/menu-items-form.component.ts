import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { FormDirective } from '../../shared/forms/form.directive';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { LoadingState } from '../../../enums/loading-state';
import { MenuPage } from '../../../models/menu-page';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuPagesService } from '../../../services/crud/menu-pages.service';
import { Title } from '@angular/platform-browser';
import {
  TranslocoDirective,
  TranslocoPipe,
  TranslocoService,
} from '@jsverse/transloco';
import { ConfirmationService } from 'primeng/api';
import { marker } from '@jsverse/transloco-keys-manager/marker';
import { catchError } from 'rxjs/operators';
import { forkJoin, Observable, of } from 'rxjs';
import { toastNotification } from '../../../ngrx/actions/notifications.actions';
import { MenuItem } from '../../../models/menu-item';
import { MenuItemsService } from '../../../services/crud/menu-items.service';
import { MenuItemType } from '../../../enums/menu-item-type';

import { CardModule } from 'primeng/card';
import { NgClass, NgIf } from '@angular/common';
import { PaginatorModule } from 'primeng/paginator';
import { ButtonModule } from 'primeng/button';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { MenuItemPosition } from '../../../enums/menu-item-position';
import { getInstanceEquivalentFromList } from '../../../utility/array-operations';
import { reloadMenus } from '../../../ngrx/actions/core.actions';
import { selectInstanceName } from '../../../ngrx/selectors/instance-settings.selectors';
import { InputTextModule } from 'primeng/inputtext';
import { httpUrlValidator } from '../../../utility/validators/http-url.validator';
import { Select } from 'primeng/select';
import { ControlGroupDirective } from '../../shared/forms/control-group.directive';
import { FormControlDirective } from '../../shared/forms/form-control.directive';
import { IfErrorDirective } from '../../shared/forms/if-error.directive';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'lc-menu-items-form',
  imports: [
    CardModule,
    NgIf,
    PaginatorModule,
    TranslocoDirective,
    ReactiveFormsModule,
    TranslocoPipe,
    ButtonModule,
    ConfirmPopupModule,
    NgClass,
    InputTextModule,
    Select,
    FormDirective,
    ControlGroupDirective,
    FormControlDirective,
    IfErrorDirective,
  ],
  templateUrl: './menu-items-form.component.html',
  styleUrl: './menu-items-form.component.scss',
  providers: [ConfirmationService],
})
export class MenuItemsFormComponent implements OnInit {
  @ViewChild(FormDirective) formDirective: FormDirective;

  public menuItemForm: FormGroup;
  public loadingState = LoadingState.LOADING;
  public loadingStates = LoadingState;
  public menuItem: MenuItem;
  public menuPages: MenuPage[];
  public editMode = false;
  public types = [
    MenuItemType.MENU_PAGE,
    MenuItemType.TOPO,
    MenuItemType.ASCENTS,
    MenuItemType.RANKING,
    MenuItemType.GALLERY,
    MenuItemType.NEWS,
    MenuItemType.HISTORY,
    MenuItemType.URL,
  ];
  public positions = [MenuItemPosition.TOP, MenuItemPosition.BOTTOM];
  public icons = [
    marker('pi-book'),
    marker('pi-building'),
    marker('pi-calendar'),
    marker('pi-camera'),
    marker('pi-cloud'),
    marker('pi-envelope'),
    marker('pi-flag'),
    marker('pi-globe'),
    marker('pi-home'),
    marker('pi-shield'),
    marker('pi-wallet'),
    marker('pi-clock'),
    marker('pi-shopping-bag'),
    marker('pi-instagram'),
    marker('pi-youtube'),
  ];

  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private menuPagesService = inject(MenuPagesService);
  private menuItemsService = inject(MenuItemsService);
  private title = inject(Title);
  private translocoService = inject(TranslocoService);
  private confirmationService = inject(ConfirmationService);

  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    const menuItemId = this.route.snapshot.paramMap.get('menu-item-id');
    let menuItemRequest: Observable<MenuItem> = of(null);
    if (menuItemId) {
      menuItemRequest = this.menuItemsService.getMenuItem(menuItemId).pipe(
        catchError((e) => {
          if (e.status === 404) {
            this.router.navigate(['/not-found']);
          }
          return of(e);
        }),
      );
    }
    forkJoin([menuItemRequest, this.menuPagesService.getMenuPages()]).subscribe(
      ([menuItem, menuPages]) => {
        this.menuPages = menuPages;
        this.buildForm();
        if (menuItem) {
          this.store.select(selectInstanceName).subscribe((instanceName) => {
            this.title.setTitle(
              `${this.translocoService.translate(marker('editMenuItemFormBrowserTitle'))} - ${instanceName}`,
            );
          });
          this.editMode = true;
          this.menuItemForm.disable();
          this.menuItem = menuItem;
          this.setFormValue();
          this.loadingState = LoadingState.DEFAULT;
        } else {
          this.store.select(selectInstanceName).subscribe((instanceName) => {
            this.title.setTitle(
              `${this.translocoService.translate(marker('menuItemFormBrowserTitle'))} - ${instanceName}`,
            );
          });
          this.loadingState = LoadingState.DEFAULT;
        }
      },
    );
  }

  /**
   * Builds the menu item form.
   */
  private buildForm() {
    const positionParam = this.route.snapshot.paramMap.get('position');
    const position =
      positionParam === 'top' ? MenuItemPosition.TOP : MenuItemPosition.BOTTOM;
    this.menuItemForm = this.fb.group({
      type: [MenuItemType.MENU_PAGE, [Validators.required]],
      position: [position, [Validators.required]],
      menuPage: [null],
      icon: [null],
      url: [null],
      title: [null],
    });
    this.menuItemForm
      .get('type')
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.setValidators();
      });
    this.setValidators();
  }

  private setValidators() {
    if (this.menuItemForm.get('type').value === MenuItemType.MENU_PAGE) {
      this.menuItemForm.get('menuPage').setValidators([Validators.required]);
      this.menuItemForm.get('menuPage').enable();
      this.menuItemForm
        .get('menuPage')
        .setValue(this.menuPages.length > 0 ? this.menuPages[0] : null);
      this.menuItemForm.get('icon').setValidators([Validators.required]);
      this.menuItemForm.get('icon').enable();
      this.menuItemForm.get('icon').setValue(this.icons[0]);
      this.menuItemForm.get('url').setValidators([]);
      this.menuItemForm.get('url').disable();
      this.menuItemForm.get('url').setValue(null);
      this.menuItemForm.get('title').setValidators([]);
      this.menuItemForm.get('title').disable();
      this.menuItemForm.get('title').setValue(null);
    } else if (this.menuItemForm.get('type').value === MenuItemType.URL) {
      this.menuItemForm
        .get('url')
        .setValidators([Validators.required, httpUrlValidator()]);
      this.menuItemForm.get('url').enable();
      this.menuItemForm.get('title').setValidators([Validators.required]);
      this.menuItemForm.get('title').enable();
      this.menuItemForm.get('icon').setValidators([Validators.required]);
      this.menuItemForm.get('icon').enable();
      this.menuItemForm.get('icon').setValue(this.icons[0]);
      this.menuItemForm.get('menuPage').setValidators([]);
      this.menuItemForm.get('menuPage').disable();
      this.menuItemForm.get('menuPage').setValue(null);
    } else {
      this.menuItemForm.get('menuPage').setValidators([]);
      this.menuItemForm.get('menuPage').disable();
      this.menuItemForm.get('menuPage').setValue(null);
      this.menuItemForm.get('icon').setValidators([]);
      this.menuItemForm.get('icon').disable();
      this.menuItemForm.get('icon').setValue(null);
      this.menuItemForm.get('url').setValidators([]);
      this.menuItemForm.get('url').disable();
      this.menuItemForm.get('url').setValue(null);
      this.menuItemForm.get('title').setValidators([]);
      this.menuItemForm.get('title').disable();
      this.menuItemForm.get('title').setValue(null);
    }
  }

  /**
   * Sets the form value based on an input sector and enables the form afterward.
   */
  private setFormValue() {
    this.menuItemForm.enable();
    this.menuItemForm.patchValue({
      type: this.menuItem.type,
      position: this.menuItem.position,
      icon: this.menuItem.icon,
      url: this.menuItem.url,
      title: this.menuItem.title,
      menuPage: getInstanceEquivalentFromList(
        this.menuItem.menuPage,
        this.menuPages,
      ),
    });
  }

  /**
   * Cancels the form.
   */
  cancel() {
    this.router.navigate(['/menu-items']);
  }

  /**
   * Saves the menu page and navigates to the menu page list.
   */
  public saveMenuItem() {
    if (this.menuItemForm.valid) {
      this.loadingState = LoadingState.LOADING;
      const menuItem = new MenuItem();
      menuItem.type = this.menuItemForm.get('type').value;
      menuItem.position = this.menuItemForm.get('position').value;
      menuItem.menuPage = this.menuItemForm.get('menuPage').value;
      menuItem.icon = this.menuItemForm.get('icon').value;
      menuItem.url = this.menuItemForm.get('url').value;
      menuItem.title = this.menuItemForm.get('title').value;
      if (this.menuItem) {
        menuItem.id = this.menuItem.id;
        this.menuItemsService.updateMenuItem(menuItem).subscribe(() => {
          this.store.dispatch(toastNotification('MENU_ITEM_UPDATED'));
          this.router.navigate(['/menu-items']);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(reloadMenus());
        });
      } else {
        this.menuItemsService.createMenuItem(menuItem).subscribe(() => {
          this.store.dispatch(toastNotification('MENU_ITEM_CREATED'));
          this.router.navigate(['/menu-items']);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(reloadMenus());
        });
      }
    } else {
      this.formDirective.markAsTouched();
    }
  }

  /**
   * Asks if the menu item should really get deleted.
   * @param event Click event.
   */
  confirmDeleteMenuItem(event: Event) {
    this.confirmationService.confirm({
      target: event.target,
      message: this.translocoService.translate(
        marker('menuItems.askReallyWantToDeleteMenuItem'),
      ),
      acceptLabel: this.translocoService.translate(
        marker('menuItems.yesDelete'),
      ),
      acceptButtonStyleClass: 'p-button-danger',
      rejectLabel: this.translocoService.translate(
        marker('menuItems.noDontDelete'),
      ),
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.deleteMenuItem();
      },
    });
  }

  /**
   * Deletes the menu item and navigates to the menu items list.
   */
  public deleteMenuItem() {
    this.menuItemsService.deleteMenuItem(this.menuItem).subscribe(() => {
      this.store.dispatch(toastNotification('MENU_ITEM_DELETED'));
      this.store.dispatch(reloadMenus());
      this.router.navigate(['/menu-items']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }
}
