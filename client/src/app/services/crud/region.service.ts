import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Region} from '../../models/region';
import {Observable} from 'rxjs';
import {map, tap} from 'rxjs/operators';
import {deserializeGrade, Grade} from '../../utility/misc/grades';

/**
 * CRUD service for regions.
 */
@Injectable({
  providedIn: 'root'
})
export class RegionService {

  constructor(private api: ApiService,
              private http: HttpClient) {
  }

  /**
   * Returns a Region.
   *
   * @return Observable of a Region.
   */
  public getRegion(): Observable<Region> {
    return this.http.get(this.api.region.getDetail()).pipe(map(Region.deserialize));
  }

  /**
   * Updates a Region.
   *
   * @param region Region to persist.
   * @return Observable of null.
   */
  public updateRegion(region: Region): Observable<Region> {
    return this.http.put(this.api.region.update(), Region.serialize(region)).pipe(
      map(Region.deserialize)
    );
  }

  /**
   * Returns a list of Grades.
   *
   * @return Observable of a list of Grades.
   */
  public getRegionGrades(): Observable<Grade[]> {
    return this.http.get(this.api.region.getGrades()).pipe(map((gradeListJson: any) => gradeListJson.map(deserializeGrade)));
  }

}
