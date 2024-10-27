import {Injectable} from '@angular/core';
import {ApiService} from '../core/api.service';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Area} from '../../models/area';
import {ArchiveType} from '../../enums/archive-type';
import {Line} from '../../models/line';
import {TopoImage} from '../../models/topo-image';
import {Sector} from '../../models/sector';
import {Crag} from '../../models/crag';

/**
 * CRUD service for areas.
 */
@Injectable({
  providedIn: 'root',
})
export class ArchiveService {
  constructor(
    private api: ApiService,
    private http: HttpClient,
  ) {}

  /**
   * Adjust the archive status of a single line
   *
   * @param line Line to adjust the archive status
   * @return Observable of null
   */
  public changeLineArchived(line: Line): Observable<object> {
    return this.http
      .post(this.api.archive.setArchived(), {
        type: ArchiveType.LINE,
        slug: line.slug,
        value: Boolean(line.archived),
      });
  }

  /**
   * Adjust the archive status of a single topo image
   *
   * @param topoImage Topo image to adjust the archive status
   * @return Observable of null
   */
  public changeTopoImageArchived(topoImage: TopoImage): Observable<object> {
    return this.http
      .post(this.api.archive.setArchived(), {
        type: ArchiveType.TOPO_IMAGE  ,
        slug: topoImage.id,
        value: Boolean(topoImage.archived),
      });
  }

  /**
   * Sets all lines and topo images in an area to archived
   *
   * @param area Area to archive
   * @return Observable of null
   */
  public setAreaArchived(area: Area): Observable<object> {
    return this.http
      .post(this.api.archive.setArchived(), {
        type: ArchiveType.AREA,
        slug: area.slug,
        value: true,
      });
  }

  /**
   * Sets all lines and topo images in a sector to archived
   *
   * @param sector Sector to archive
   * @return Observable of null
   */
  public setSectorArchived(sector: Sector): Observable<object> {
    return this.http
      .post(this.api.archive.setArchived(), {
        type: ArchiveType.SECTOR,
        slug: sector.slug,
        value: true,
      });
  }

  /**
   * Sets all lines and topo images in a crag to archived
   *
   * @param crag Crag to archive
   * @return Observable of null
   */
  public setCragArchived(crag: Crag): Observable<object> {
    return this.http
      .post(this.api.archive.setArchived(), {
        type: ArchiveType.CRAG,
        slug: crag.slug,
        value: true,
      });
  }
}
