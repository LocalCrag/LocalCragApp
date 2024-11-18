import { Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '../../models/user';
import { LoginResponse } from '../../models/login-response';
import { UserPromotionTargets } from '../../enums/user-promotion-targets';
import { deserializeGrade, Grade } from '../../models/scale';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  public registerUser(user: User): Observable<User> {
    return this.http
      .post(this.api.users.register(), User.serializeNewUser(user))
      .pipe(map(User.deserialize));
  }

  public updateAccount(user: User): Observable<User> {
    return this.http
      .put(this.api.users.updateAccount(), User.serializeAccountInfo(user))
      .pipe(map(User.deserialize));
  }

  public resendUserCreateMail(user: User): Observable<null> {
    return this.http
      .put(this.api.users.resendUserCreateMail(user.id), null)
      .pipe(map(() => null));
  }

  public getEmailTaken(email: string): Observable<boolean> {
    return this.http
      .get(this.api.users.getEmailTaken(email))
      .pipe(map((response) => response as boolean));
  }

  public changeEmail(hash: string): Observable<LoginResponse> {
    return this.http
      .put(this.api.users.changeEmail(), { newEmailHash: hash })
      .pipe(map(LoginResponse.deserialize));
  }

  public getUsers(): Observable<User[]> {
    return this.http
      .get(this.api.users.getList())
      .pipe(map((userListJson: any) => userListJson.map(User.deserialize)));
  }

  public getUser(slug: string): Observable<User> {
    return this.http
      .get(this.api.users.getDetail(slug))
      .pipe(map(User.deserialize));
  }

  public deleteUser(user: User): Observable<null> {
    return this.http
      .delete(this.api.users.delete(user.id))
      .pipe(map(() => null));
  }

  public promoteUser(
    id: string,
    target: UserPromotionTargets,
  ): Observable<User> {
    return this.http
      .put(this.api.users.promoteUser(id), { promotionTarget: target })
      .pipe(map(User.deserialize));
  }

  public getUserGrades(userSlug: string): Observable<Grade[]> {
    return this.http
      .get(this.api.users.getGrades(userSlug))
      .pipe(map((gradeListJson: any) => gradeListJson.map(deserializeGrade)));
  }
}
