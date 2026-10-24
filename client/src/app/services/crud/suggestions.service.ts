import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiService } from '../core/api.service';

export interface SuggestionAuthor {
  id: string;
  firstname: string;
  lastname: string;
  slug: string;
}

export interface SuggestionLine {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  createdBy: SuggestionAuthor | null;
  cragSlug: string;
  sectorSlug: string;
  areaSlug: string;
  cragName: string;
  sectorName: string;
  areaName: string;
  linePaths: unknown[];
}

export interface SuggestionTopoImage {
  id: string;
  title: string | null;
  image: unknown;
  linePaths: unknown[];
  createdBy: SuggestionAuthor | null;
  cragSlug: string;
  sectorSlug: string;
  areaSlug: string;
  cragName: string;
  sectorName: string;
  areaName: string;
}

export interface SuggestionQueue {
  lines: SuggestionLine[];
  topoImages: SuggestionTopoImage[];
}

@Injectable({
  providedIn: 'root',
})
export class SuggestionsService {
  private api = inject(ApiService);
  private http = inject(HttpClient);

  public getQueue(): Observable<SuggestionQueue> {
    return this.http.get<SuggestionQueue>(this.api.suggestions.getList());
  }

  public publishLine(
    slug: string,
    message: string | null,
  ): Observable<unknown> {
    return this.http.post(this.api.lines.publish(slug), { message });
  }

  public rejectLine(slug: string, message: string | null): Observable<unknown> {
    return this.http.post(this.api.lines.reject(slug), { message });
  }

  public publishTopoImage(
    id: string,
    message: string | null,
  ): Observable<unknown> {
    return this.http.post(this.api.topoImages.publish(id), { message });
  }

  public rejectTopoImage(
    id: string,
    message: string | null,
  ): Observable<unknown> {
    return this.http.post(this.api.topoImages.reject(id), { message });
  }
}
