import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from './Response.interceptor';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const messageKey =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const errorResponse: ApiResponse<null> = {
      meta: {
        success: false,
        message: messageKey,
      },
      body: null,
    };

    response.status(status).json(errorResponse);
  }
}
