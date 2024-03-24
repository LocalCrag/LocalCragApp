import {Component, OnInit, ViewChild} from '@angular/core';
import {FormDirective} from '../../shared/forms/form.directive';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {LoadingState} from '../../../enums/loading-state';
import {MenuPage} from '../../../models/menu-page';
import {Store} from '@ngrx/store';
import {ActivatedRoute, Router} from '@angular/router';
import {MenuPagesService} from '../../../services/crud/menu-pages.service';
import {Title} from '@angular/platform-browser';
import {TranslocoDirective, TranslocoPipe, TranslocoService} from '@ngneat/transloco';
import {ConfirmationService} from 'primeng/api';
import {marker} from '@ngneat/transloco-keys-manager/marker';
import {environment} from '../../../../environments/environment';
import {catchError} from 'rxjs/operators';
import {forkJoin, Observable, of} from 'rxjs';
import {toastNotification} from '../../../ngrx/actions/notifications.actions';
import {NotificationIdentifier} from '../../../utility/notifications/notification-identifier.enum';
import {MenuItem} from '../../../models/menu-item';
import {MenuItemsService} from '../../../services/crud/menu-items.service';
import {MenuItemType} from '../../../enums/menu-item-type';
import {UntilDestroy, untilDestroyed} from '@ngneat/until-destroy';
import {CardModule} from 'primeng/card';
import {NgIf} from '@angular/common';
import {PaginatorModule} from 'primeng/paginator';
import {SharedModule} from '../../shared/shared.module';
import {ButtonModule} from 'primeng/button';
import {ConfirmPopupModule} from 'primeng/confirmpopup';
import {MenuItemPosition} from '../../../enums/menu-item-position';
import {getInstanceEquivalentFromList} from '../../../utility/array-operations';
import {reloadMenus} from '../../../ngrx/actions/core.actions';

@Component({
  selector: 'lc-menu-items-form',
  standalone: true,
  imports: [
    CardModule,
    NgIf,
    PaginatorModule,
    SharedModule,
    TranslocoDirective,
    ReactiveFormsModule,
    TranslocoPipe,
    ButtonModule,
    ConfirmPopupModule
  ],
  templateUrl: './menu-items-form.component.html',
  styleUrl: './menu-items-form.component.scss',
  providers: [ConfirmationService],
})
@UntilDestroy()
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
    MenuItemType.NEWS,
    MenuItemType.YOUTUBE,
    MenuItemType.INSTAGRAM,
  ]
  public positions = [
    MenuItemPosition.TOP,
    MenuItemPosition.BOTTOM,
  ]

  constructor(private fb: FormBuilder,
              private store: Store,
              private route: ActivatedRoute,
              private router: Router,
              private menuPagesService: MenuPagesService,
              private menuItemsService: MenuItemsService,
              private title: Title,
              private translocoService: TranslocoService,
              private confirmationService: ConfirmationService) {
  }


  /**
   * Builds the form on component initialization.
   */
  ngOnInit() {
    const menuItemId = this.route.snapshot.paramMap.get('menu-item-id');
    let menuItemRequest: Observable<MenuItem> = of(null);
    if (menuItemId) {
      menuItemRequest = this.menuItemsService.getMenuItem(menuItemId).pipe(catchError(e => {
        if (e.status === 404) {
          this.router.navigate(['/not-found']);
        }
        return of(e);
      }));
    }
    forkJoin([menuItemRequest, this.menuPagesService.getMenuPages()]).subscribe(([menuItem, menuPages]) => {
      this.menuPages = menuPages;
      this.buildForm();
      if (menuItem) {
        this.title.setTitle(`${this.translocoService.translate(marker('editMenuItemFormBrowserTitle'))} - ${environment.instanceName}`)
        this.editMode = true;
        this.menuItemForm.disable();
        this.menuItem = menuItem;
        this.setFormValue();
        this.loadingState = LoadingState.DEFAULT;
      } else {
        this.title.setTitle(`${this.translocoService.translate(marker('menuItemFormBrowserTitle'))} - ${environment.instanceName}`)
        this.loadingState = LoadingState.DEFAULT;
      }
    })
  }


  /**
   * Builds the menu item form.
   */
  private buildForm() {
    const positionParam = this.route.snapshot.paramMap.get('position');
    const position = positionParam === 'top' ? MenuItemPosition.TOP : MenuItemPosition.BOTTOM;
    this.menuItemForm = this.fb.group({
      type: [MenuItemType.MENU_PAGE, [Validators.required]],
      position: [position, [Validators.required]],
      menuPage: [this.menuPages.length > 0 ? this.menuPages[0] : null, [Validators.required]],
    });
    this.menuItemForm.get('type').valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setValidators();
    });
  }

  private setValidators() {
    if (this.menuItemForm.get('type').value === MenuItemType.MENU_PAGE) {
      this.menuItemForm.get('menuPage').setValidators([Validators.required])
      this.menuItemForm.get('menuPage').enable();
    } else {
      this.menuItemForm.get('menuPage').setValidators([])
      this.menuItemForm.get('menuPage').disable();
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
      menuPage: getInstanceEquivalentFromList(this.menuItem.menuPage, this.menuPages)
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
      if (this.menuItem) {
        menuItem.id = this.menuItem.id;
        this.menuItemsService.updateMenuItem(menuItem).subscribe(() => {
          this.store.dispatch(toastNotification(NotificationIdentifier.MENU_ITEM_UPDATED));
          this.router.navigate(['/menu-items']);
          this.loadingState = LoadingState.DEFAULT;
          this.store.dispatch(reloadMenus());
        });
      } else {
        this.menuItemsService.createMenuItem(menuItem).subscribe(() => {
          this.store.dispatch(toastNotification(NotificationIdentifier.MENU_ITEM_CREATED));
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
    this.translocoService.load(`${environment.language}`).subscribe(() => {
      this.confirmationService.confirm({
        target: event.target,
        message: this.translocoService.translate(marker('menuItems.askReallyWantToDeleteMenuItem')),
        acceptLabel: this.translocoService.translate(marker('menuItems.yesDelete')),
        acceptButtonStyleClass: 'p-button-danger',
        rejectLabel: this.translocoService.translate(marker('menuItems.noDontDelete')),
        icon: 'pi pi-exclamation-triangle',
        accept: () => {
          this.deleteMenuItem();
        },
      });
    });
  }

  /**
   * Deletes the menu item and navigates to the menu items list.
   */
  public deleteMenuItem() {
    this.menuItemsService.deleteMenuItem(this.menuItem).subscribe(() => {
      this.store.dispatch(toastNotification(NotificationIdentifier.MENU_ITEM_DELETED));
      this.store.dispatch(reloadMenus());
      this.router.navigate(['/menu-items']);
      this.loadingState = LoadingState.DEFAULT;
    });
  }

}
