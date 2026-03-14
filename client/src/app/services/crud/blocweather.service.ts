import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export type BlocWeatherConfig = {
  country: string;
  region: string;
  spot: string;
};

@Injectable({ providedIn: 'root' })
export class BlocWeatherService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  /**
   * Fetch nearest blocweather URL for a given level and slug from backend.
   * Example backend route: GET /api/blocweather/nearest/<level>/<slug>
   */
  public getNearest(
    level: string,
    slug: string,
  ): Observable<BlocWeatherConfig | null> {
    return this.http
      .get<{
        blocweatherUrl: string;
      }>(this.api.blocweather.getNearest(level, slug))
      .pipe(
        map((response) => {
          if (response.blocweatherUrl == null) {
            return null;
          }

          const path = response.blocweatherUrl.replace(
            'https://blocweather.com/',
            '',
          );

          const segments = path.split('/');
          const country = segments[0];
          const region = segments[1];
          const spot = segments[2];

          return { country, region, spot } as BlocWeatherConfig;
        }),
      );
  }
}
