import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {ArchiveObjects, ArchiveStats} from "../../models/archive";

@Injectable({
  providedIn: 'root'
})
export class ArchiveService {

  constructor(private api: ApiService,
              private http: HttpClient) {
  }

  public updateArchive(archive: ArchiveObjects): Observable<ArchiveStats> {
    return this.http.post(this.api.archive.updateArchived(), ArchiveObjects.serialize(archive)).pipe(
      map(ArchiveStats.deserialize)
    );
  }

}
