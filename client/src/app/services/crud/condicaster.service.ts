import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ApiService } from '../core/api.service';

export interface CondicasterHour {
  local_date: string;
  valid_at: string;
  condiscore: number;
  temperature_c: number | null;
  rain_mm: number | null;
  rain_probability_pct: number | null;
  humidity_pct: number | null;
  wind_speed_kmh: number | null;
  cloud_cover_pct: number | null;
  solar_radiation_pct: number | null;
}

export interface CondicasterSunWindow {
  start_at: string;
  end_at: string;
}

export interface CondicasterDay {
  local_date: string;
  daytime_condiscore: number | null;
  morning_condiscore: number | null;
  afternoon_condiscore: number | null;
  evening_condiscore: number | null;
  temperature_min_c: number | null;
  temperature_max_c: number | null;
  sunrise_at: string | null;
  sunset_at: string | null;
  direct_sun_windows: CondicasterSunWindow[];
  explanation: {
    reason?: string;
    suggestion?: string;
    factors?: string[];
    best_window?: number[];
  } | null;
}

export interface CondicasterCragHit {
  cragId: number;
  name: string | null;
  areaName: string | null;
  countryName: string | null;
  distanceKm: number | string | null;
}

export interface CondicasterConditions {
  condicasterCragId: number | null;
  timezone: string | null;
  currentCondiscore: number | null;
  currentValidAt: string | null;
  hourly: CondicasterHour[];
  daily: CondicasterDay[];
  hourlyFetchedAt: string | null;
  dailyFetchedAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class CondicasterService {
  private http = inject(HttpClient);
  private api = inject(ApiService);

  public getConditions(
    level: 'crag' | 'sector' | 'area',
    slug: string,
  ): Observable<CondicasterConditions> {
    return this.http.get<CondicasterConditions>(
      this.api.condicaster.getConditions(level, slug),
    );
  }

  public searchCrags(
    lat: number,
    lng: number,
  ): Observable<CondicasterCragHit[]> {
    const params = new HttpParams().set('lat', lat).set('lon', lng);
    return this.search(params);
  }

  private search(params: HttpParams): Observable<CondicasterCragHit[]> {
    return this.http
      .get<{ crags: CondicasterCragHit[] }>(
        this.api.condicaster.searchCrags(),
        {
          params,
        },
      )
      .pipe(map((response) => response.crags ?? []));
  }
}
