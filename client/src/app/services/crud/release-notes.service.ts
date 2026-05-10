import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from '../core/api.service';
import { ReleaseNoteBundlePayload } from '../../models/release-note-bundle';

@Injectable({
  providedIn: 'root',
})
export class ReleaseNotesService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getBundle(bundleId: string): Observable<ReleaseNoteBundlePayload> {
    return this.http
      .get<ReleaseNoteBundlePayload>(
        this.api.account.releaseNoteBundle(bundleId),
      )
      .pipe(map((payload) => payload));
  }
}
