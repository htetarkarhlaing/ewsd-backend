import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from './Response.interceptor';
import { I18nService, I18nContext } from 'nestjs-i18n';

@Catch()
export class ExceptionsFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const messageKey =
      exception instanceof HttpException
        ? exception.message
        : 'errors.internal_server_error';

    const translatedMessage: string = await this.i18n.translate(messageKey, {
      lang: I18nContext.current()?.lang || 'en',
    });

    const errorResponse: ApiResponse<null> = {
      meta: {
        success: false,
        message: translatedMessage,
      },
      body: null,
    };

    response.status(status).json(errorResponse);
  }
}
