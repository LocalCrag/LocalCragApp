import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {select, Store} from '@ngrx/store';
import {AppState} from '../ngrx/reducers';
import {selectIsLoggedOut} from '../ngrx/selectors/auth.selectors';

/**
 * Guard for checking if a user is logged out.
 */
@Injectable({
  providedIn: 'root'
})
export class IsLoggedOutGuard implements CanActivate {

  constructor(private store: Store<AppState>,
              private router: Router) {
  }

  /**
   * Lets the router activate the route if the user is logged out.
   *
   * @return Observable that resolves to true if the user can activate the route.
   */
  canActivate(): Observable<boolean> {
    return this.store.pipe(
      select(selectIsLoggedOut),
      map(isLoggedOutValue => {
        if (isLoggedOutValue) {
          return true;
        }
        this.router.navigate(['']);
        return false;
      })
    );
  }

}
