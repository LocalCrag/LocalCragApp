import { Injectable, inject } from '@angular/core';
import { ApiService } from '../core/api.service';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, tap, finalize, shareReplay } from 'rxjs/operators';

export type BlocWeatherConfig = {
  country: string;
  region: string;
  spot: string;
};

/** t(blocWeather.dry) **/
/** t(blocWeather.mostly_dry) **/
/** t(blocWeather.some_wet) **/
/** t(blocWeather.mostly_wet) **/
/** t(blocWeather.wet) **/
export type BlocWeatherClassification = {
  classification: 'dry' | 'mostly_dry' | 'some_wet' | 'mostly_wet' | 'wet';
  min_saturation: number;
  max_saturation: number;
};

export type BlocWeatherReportStatus = 'dry' | 'some_wet' | 'mostly_wet' | 'wet';

@Injectable({ providedIn: 'root' })
export class BlocWeatherService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  // Simple in-memory cache (cache forever until cleared): key -> value
  private cache = new Map<string, BlocWeatherConfig | null>();

  // Track pending in-flight requests to deduplicate concurrent calls
  private pending = new Map<string, Observable<BlocWeatherConfig | null>>();

  /**
   * Fetch nearest blocweather URL for a given level and slug from backend.
   * Example backend route: GET /api/blocweather/nearest/<level>/<slug>
   */
  public getNearest(
    level: string,
    slug: string,
  ): Observable<BlocWeatherConfig | null> {
    const key = `${level}:${slug}`;
    // Return cached value if present (cached forever)
    const cached = this.cache.get(key);
    if (cached !== undefined) {
      return of(cached);
    }

    // If a request for the same key is already in-flight, reuse it
    const pendingRequest = this.pending.get(key);
    if (pendingRequest) {
      return pendingRequest;
    }

    const request$ = this.http
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
        // Cache the result when it arrives (cached forever until clearCache is called)
        tap((result) => {
          this.cache.set(key, result);
        }),
        // When the observable completes or errors, remove the pending marker
        finalize(() => {
          this.pending.delete(key);
        }),
        // Share the same observable for concurrent subscribers
        shareReplay(1),
      );

    this.pending.set(key, request$);
    return request$;
  }

  /**
   * Clear the entire cache and cancel pending markers.
   * Use this when you need to force a refetch for all keys.
   */
  public clearCache(): void {
    this.cache.clear();
    this.pending.clear();
  }

  /**
   * Fetch the current wetness classification for a given spot directly from blocweather.com.
   * URL: https://blocweather.com/api/v1/data/<country>/<region>/<spot>/classification
   */
  public getClassification(
    config: BlocWeatherConfig,
  ): Observable<BlocWeatherClassification> {
    const url = `https://blocweather.com/api/v1/data/${config.country}/${config.region}/${config.spot}/classification`;
    return this.http.get<BlocWeatherClassification>(url);
  }

  /**
   * Report observed conditions for a given spot directly to blocweather.com.
   * URL: https://blocweather.com/api/v1/data/<country>/<region>/<spot>/report
   */
  public reportConditions(
    config: BlocWeatherConfig,
    status: BlocWeatherReportStatus,
    observedAt: Date = new Date(),
  ): Observable<void> {
    const url = `https://blocweather.com/api/v1/data/${config.country}/${config.region}/${config.spot}/reports`;
    return this.http.post<void>(url, {
      observed_at: observedAt.toISOString(),
      status,
    });
  }
}
