import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {HttpClient} from '@angular/common/http';
import {MenuPage} from '../../models/menu-page';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';

/**
 * CRUD service for menuPages.
 */
@Injectable({
  providedIn: 'root'
})
export class MenuPagesService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  /**
   * Creates a MenuPage.
   *
   * @param menuPage MenuPage to persist.
   * @return Observable of a MenuPage.
   */
  public createMenuPage(menuPage: MenuPage): Observable<MenuPage> {
    return this.http.post(this.api.menuPages.create(), MenuPage.serialize(menuPage)).pipe(
      tap(() => {
        this.cache.clear(this.api.menuPages.getList());
      }),
      map(MenuPage.deserialize)
    );
  }

  /**
   * Returns a list of MenuPages.
   *
   * @return Observable of a list of MenuPages.
   */
  public getMenuPages(): Observable<MenuPage[]> {
    return this.cache.get(this.api.menuPages.getList(), map((menuPageListJson: any) => menuPageListJson.map(MenuPage.deserialize)));
  }

  /**
   * Returns a MenuPage.
   *
   * @param slug Slug of the MenuPage to load.
   * @return Observable of a MenuPage.
   */
  public getMenuPage(slug: string): Observable<MenuPage> {
    return this.cache.get(this.api.menuPages.getDetail(slug), map(MenuPage.deserialize));
  }

  /**
   * Deletes a MenuPage.
   *
   * @param menuPage MenuPage to delete.
   * @return Observable of a MenuPage.
   */
  public deleteMenuPage(menuPage: MenuPage): Observable<null> {
    return this.http.delete(this.api.menuPages.delete(menuPage.slug)).pipe(
      tap(() => {
        this.cache.clear(this.api.menuPages.getList());
      }),
      map(() => null)
    );
  }

  /**
   * Updates a MenuPage.
   *
   * @param menuPage MenuPage to persist.
   * @return Observable of null.
   */
  public updateMenuPage(menuPage: MenuPage): Observable<MenuPage> {
    return this.http.put(this.api.menuPages.update(menuPage.slug), MenuPage.serialize(menuPage)).pipe(
      tap(() => {
        this.cache.clear(this.api.menuPages.getDetail(menuPage.slug));
        this.cache.clear(this.api.menuPages.getList());
        this.cache.clear(this.api.menuItems.getList());
      }),
      map(MenuPage.deserialize)
    );
  }


}
