import { Injectable } from '@angular/core';
import {ApiService} from '../core/api.service';
import {CacheService} from '../core/cache.service';
import {HttpClient} from '@angular/common/http';
import {Post} from '../../models/post';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {User} from '../../models/user';
import {LoginResponse} from '../../models/login-response';
import {Sector} from '../../models/sector';
import {UserPromotionTargets} from '../../enums/user-promotion-targets';
import {deserializeGrade, Grade} from '../../utility/misc/grades';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  constructor(private api: ApiService,
              private cache: CacheService,
              private http: HttpClient) {
  }

  public registerUser(user: User): Observable<User> {
    return this.http.post(this.api.users.register(), User.serializeNewUser(user)).pipe(
      tap(() => {
        this.cache.clear(this.api.users.getList());
      }),
      map(User.deserialize)
    );
  }

  public updateAccount(user: User): Observable<User> {
    return this.http.put(this.api.users.updateAccount(), User.serializeAccountInfo(user)).pipe(
      tap(() => {
        this.cache.clear(this.api.users.getList());
      }),
      map(User.deserialize)
    );
  }

  public resendUserCreateMail(user: User): Observable<null> {
    return this.http.put(this.api.users.resendUserCreateMail(user.id), null).pipe(
      map(()=>null)
    );
  }

  public getEmailTaken(email: string): Observable<boolean> {
    return this.http.get(this.api.users.getEmailTaken(email)).pipe(map(response => response as boolean));
  }

  public changeEmail(hash: string): Observable<LoginResponse> {
    return this.http.put(this.api.users.changeEmail(), {newEmailHash: hash}).pipe(
      tap(() => {
        this.cache.clear(this.api.users.getList());
      }),
      map(LoginResponse.deserialize)
    );
  }

  public getUsers(): Observable<User[]> {
    return this.cache.get(this.api.users.getList(), map((userListJson: any) => userListJson.map(User.deserialize)))
  }


  public getUser(slug: string): Observable<User> {
    return this.cache.get(this.api.users.getDetail(slug), map(User.deserialize))
  }

  public deleteUser(user: User): Observable<null> {
    return this.http.delete(this.api.users.delete(user.id)).pipe(
      tap(() => {
        this.cache.clear(this.api.users.getList());
      }),
      map(() => null)
    );
  }

  public promoteUser(id: string, target: UserPromotionTargets): Observable<User> {
    return this.http.put(this.api.users.promoteUser(id), {promotionTarget: target}).pipe(
      tap(() => {
        this.cache.clear(this.api.users.getList());
      }),
      map(User.deserialize)
    );
  }

  public getUserGrades(userSlug: string): Observable<Grade[]> {
    return this.cache.get(this.api.users.getGrades(userSlug), map((gradeListJson: any) => gradeListJson.map(deserializeGrade)));
  }

}
