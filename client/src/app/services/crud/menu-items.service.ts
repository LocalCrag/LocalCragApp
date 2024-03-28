import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {MenuItem} from '../../models/menu-item';
import {ItemOrder} from '../../interfaces/item-order.interface';
import {environment} from '../../../environments/environment';
import {Crag} from '../../models/crag';

/**
 * CRUD service for menu items.
 */
@Injectable({
  providedIn: 'root'
})
export class MenuItemsService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  /**
   * Creates a MenuItem.
   *
   * @param menuItem MenuItem to persist.
   * @return Observable of a MenuItem.
   */
  public createMenuItem(menuItem: MenuItem): Observable<MenuItem> {
    return this.http.post(this.api.menuItems.create(), MenuItem.serialize(menuItem)).pipe(
      tap(() => {
        this.cache.clear(this.api.menuItems.getList());
      }),
      map(MenuItem.deserialize)
    );
  }

  /**
   * Returns a list of MenuItems.
   *
   * @return Observable of a list of MenuItems.
   */
  public getMenuItems(): Observable<MenuItem[]> {
    return this.cache.get(this.api.menuItems.getList(), map((menuItemListJson: any) => menuItemListJson.map(MenuItem.deserialize)));
  }

  /**
   * Returns a MenuItem.
   *
   * @param id ID of the MenuItem to load.
   * @return Observable of a MenuItem.
   */
  public getMenuItem(id: string): Observable<MenuItem> {
    return this.cache.get(this.api.menuItems.getDetail(id), map(MenuItem.deserialize));
  }

  /**
   * Deletes a MenuItem.
   *
   * @param menuItem MenuItem to delete.
   * @return Observable of a MenuItem.
   */
  public deleteMenuItem(menuItem: MenuItem): Observable<null> {
    return this.http.delete(this.api.menuItems.delete(menuItem.id)).pipe(
      tap(() => {
        this.cache.clear(this.api.menuItems.getList());
      }),
      map(() => null)
    );
  }

  /**
   * Updates a MenuItem.
   *
   * @param menuItem MenuItem to persist.
   * @return Observable of null.
   */
  public updateMenuItem(menuItem: MenuItem): Observable<MenuItem> {
    return this.http.put(this.api.menuItems.update(menuItem.id), MenuItem.serialize(menuItem)).pipe(
      tap(() => {
        this.cache.clear(this.api.menuItems.getDetail(menuItem.id));
        this.cache.clear(this.api.menuItems.getList());
      }),
      map(MenuItem.deserialize)
    );
  }

  /**
   * Updates the order of all top positioned menu items.
   *
   * @param newOrder Menu item order.
   * @return Observable of null.
   */
  public updateMenuItemOrderTop(newOrder: ItemOrder): Observable<null> {
    return this.http.put(this.api.menuItems.updateOrderTop(), newOrder).pipe(
      tap(() => {
        this.cache.clear(this.api.menuItems.getList());
      }),
      map(() => null)
    );
  }

  /**
   * Updates the order of all bottom positioned menu items.
   *
   * @param newOrder Menu item order.
   * @return Observable of null.
   */
  public updateMenuItemOrderBottom(newOrder: ItemOrder): Observable<null> {
    return this.http.put(this.api.menuItems.updateOrderBottom(), newOrder).pipe(
      tap(() => {
        this.cache.clear(this.api.menuItems.getList());
      }),
      map(() => null)
    );
  }

  public getCragMenuStructure(): Observable<Crag[]> {
    return this.cache.get(this.api.menuItems.getCragMenuStructure(), map((cragListJson: any) => cragListJson.map(Crag.deserialize)));
  }


}
