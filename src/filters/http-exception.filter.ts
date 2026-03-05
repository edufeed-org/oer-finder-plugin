import {
  Catch,
  ArgumentsHost,
  HttpException,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Global exception filter that prevents internal error details from leaking
 * in production. Non-HttpException errors always return a generic 500 message.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  private readonly isProduction: boolean;

  constructor(nodeEnv: string) {
    this.isProduction = nodeEnv === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (response.headersSent) {
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    const message =
      exception instanceof Error ? exception.message : 'Unknown error';
    this.logger.error(`Unhandled exception: ${message}`, exception);

    response.status(500).json({
      statusCode: 500,
      message: this.isProduction ? 'Internal server error' : message,
    });
  }
}
