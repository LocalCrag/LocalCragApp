import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {MenuPage} from '../../models/menu-page';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

/**
 * CRUD service for menuPages.
 */
@Injectable({
  providedIn: 'root',
})
export class MenuPagesService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  /**
   * Creates a MenuPage.
   *
   * @param menuPage MenuPage to persist.
   * @return Observable of a MenuPage.
   */
  public createMenuPage(menuPage: MenuPage): Observable<MenuPage> {
    return this.http
      .post(this.api.menuPages.create(), MenuPage.serialize(menuPage))
      .pipe(map(MenuPage.deserialize));
  }

  /**
   * Returns a list of MenuPages.
   *
   * @return Observable of a list of MenuPages.
   */
  public getMenuPages(): Observable<MenuPage[]> {
    return this.http
      .get(this.api.menuPages.getList())
      .pipe(
        map((menuPageListJson: any) =>
          menuPageListJson.map(MenuPage.deserialize),
        ),
      );
  }

  /**
   * Returns a MenuPage.
   *
   * @param slug Slug of the MenuPage to load.
   * @return Observable of a MenuPage.
   */
  public getMenuPage(slug: string): Observable<MenuPage> {
    return this.http
      .get(this.api.menuPages.getDetail(slug))
      .pipe(map(MenuPage.deserialize));
  }

  /**
   * Deletes a MenuPage.
   *
   * @param menuPage MenuPage to delete.
   * @return Observable of a MenuPage.
   */
  public deleteMenuPage(menuPage: MenuPage): Observable<null> {
    return this.http
      .delete(this.api.menuPages.delete(menuPage.slug))
      .pipe(map(() => null));
  }

  /**
   * Updates a MenuPage.
   *
   * @param menuPage MenuPage to persist.
   * @return Observable of null.
   */
  public updateMenuPage(menuPage: MenuPage): Observable<MenuPage> {
    return this.http
      .put(
        this.api.menuPages.update(menuPage.slug),
        MenuPage.serialize(menuPage),
      )
      .pipe(map(MenuPage.deserialize));
  }
}
