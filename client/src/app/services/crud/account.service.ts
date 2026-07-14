import { inject, Injectable } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AccountSettings } from '../../models/account-settings';
import { LanguageService } from '../core/language.service';
import { ThemeService } from '../core/theme.service';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private api = inject(ApiService);
  private http = inject(HttpClient);
  private languageService = inject(LanguageService);
  private themeService = inject(ThemeService);

  public getAccountSettings(): Observable<AccountSettings> {
    return this.http.get(this.api.account.getSettings()).pipe(
      map(AccountSettings.deserialize),
      tap((settings: AccountSettings) => {
        this.themeService.applyColorScheme(settings.colorScheme);
      }),
    );
  }

  public updateAccountSettings(
    accountSettings: AccountSettings,
  ): Observable<AccountSettings> {
    return this.http
      .put(
        this.api.account.updateSettings(),
        AccountSettings.serialize(accountSettings),
      )
      .pipe(
        map(AccountSettings.deserialize),
        tap((settings: AccountSettings) => {
          this.languageService.setUserLanguage(settings.language);
          this.themeService.applyColorScheme(settings.colorScheme);
        }),
      );
  }
}
