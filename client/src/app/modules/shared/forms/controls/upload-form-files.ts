import { HttpClient, HttpEventType } from '@angular/common/http';
import { Subscription } from 'rxjs';

/**
 * Drops files over the instance image limit. A missing limit accepts every file.
 */
export function splitFilesByMaxSize(
  files: globalThis.File[],
  maxImageSize: number,
): { accepted: globalThis.File[]; oversized: boolean } {
  if (!maxImageSize) {
    return { accepted: files, oversized: false };
  }
  const accepted = files.filter((file) => file.size <= maxImageSize);
  return { accepted, oversized: accepted.length !== files.length };
}

/**
 * Posts selected files to the existing upload endpoint and reports progress.
 * The field name matches the previous PrimeNG file upload (`upload`).
 */
export function uploadFormFiles(
  http: HttpClient,
  url: string,
  files: globalThis.File[],
  handlers: {
    onProgress: (progress: number) => void;
    onBody: (body: unknown) => void;
    onError: () => void;
  },
): Subscription {
  const formData = new FormData();
  for (const file of files) {
    formData.append('upload', file);
  }
  return http
    .post(url, formData, { reportProgress: true, observe: 'events' })
    .subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          handlers.onProgress(Math.round((100 * event.loaded) / event.total));
        } else if (event.type === HttpEventType.Response) {
          handlers.onBody(event.body);
        }
      },
      error: () => handlers.onError(),
    });
}
