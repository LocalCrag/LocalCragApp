import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ArchiveStats} from "../../models/archive";

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {

  constructor(private api: ApiService,
              private http: HttpClient) {
  }

  public archiveArea(slug: string): Observable<ArchiveStats> {
    return this.http.post(this.api.archive.archiveArea(slug), {}).pipe(
      map(ArchiveStats.deserialize)
    );
  }

  public archiveSector(slug: string): Observable<ArchiveStats> {
    return this.http.post(this.api.archive.archiveSector(slug), {}).pipe(
      map(ArchiveStats.deserialize)
    );
  }

  public archiveCrag(slug: string): Observable<ArchiveStats> {
    return this.http.post(this.api.archive.archiveCrag(slug), {}).pipe(
      map(ArchiveStats.deserialize)
    );
  }

}
