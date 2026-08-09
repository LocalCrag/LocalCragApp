import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { rewriteLoopbackMediaUrlForAndroid } from '../../../utility/rewrite-loopback-media-url';

/**
 * Sanitizes HTML for use in innerHTML attributes.
 * On native Android, also rewrites loopback MinIO/S3 hosts inside the HTML so
 * embedded <img> URLs from the editor reach the emulator host (10.0.2.2).
 */
@Pipe({
  name: 'sanitizeHtml',
})
export class SanitizeHtmlPipe implements PipeTransform {
  private _sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    const rewritten = rewriteLoopbackMediaUrlForAndroid(value) ?? '';
    return this._sanitizer.bypassSecurityTrustHtml(rewritten);
  }
}
