/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { unset } from 'lodash';
import { Reflector } from '@nestjs/core';

export interface MetaData {
  success: boolean;
  message: string;
}

export interface ApiResponse<T> {
  meta: MetaData;
  body: T | null;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  constructor(private reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponse<T>> {
    const skipInterceptor = this.reflector.get<boolean>(
      'skipInterceptor',
      context.getHandler(),
    );

    if (skipInterceptor) {
      return next.handle() as Observable<ApiResponse<T>>;
    }

    return next.handle().pipe(
      map((data) => {
        const message = (data as any).message || 'Operation successful';
        unset(data, 'message');

        return {
          meta: {
            success: true,
            message,
          },
          body: data,
        };
      }),
    );
  }
}
