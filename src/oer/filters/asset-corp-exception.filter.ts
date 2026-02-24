import {
  Catch,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Exception filter that sets Cross-Origin-Resource-Policy: cross-origin
 * on all error responses from the asset redirect endpoint.
 *
 * Without this, helmet's default CORP header (same-origin) is left intact
 * on error responses (e.g. 429 from ThrottlerGuard), causing browsers to
 * block the response entirely with NS_ERROR_DOM_CORP_FAILED when images
 * are loaded cross-origin via <img> tags.
 */
@Catch()
export class AssetCorpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    response.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const body =
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: 500, message: 'Internal server error' };

    response.status(status).json(body);
  }
}
