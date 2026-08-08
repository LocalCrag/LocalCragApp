import { HttpContextToken } from '@angular/common/http';

/**
 * Marks a request as a connectivity probe so the error interceptor can skip
 * offline-banner / console noise on expected status-0 failures while polling.
 */
export const CONNECTIVITY_PROBE = new HttpContextToken<boolean>(() => false);
