import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { ErrorHandlerService } from './error-handler.service';

/**
 * Angular ErrorHandler that shows the offline banner for network/chunk failures,
 * then forwards to Sentry's handler.
 *
 * Resolves ErrorHandlerService lazily via Injector to avoid a DI cycle:
 * ErrorHandler → ErrorHandlerService → Store/HTTP → ErrorHandler.
 */
@Injectable()
export class LocalCragErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);
  private readonly sentryHandler = Sentry.createErrorHandler({
    showDialog: false,
  });

  handleError(error: unknown): void {
    this.injector.get(ErrorHandlerService).handleClientError(error);
    this.sentryHandler.handleError(error);
  }
}
