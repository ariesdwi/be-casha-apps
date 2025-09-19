import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    return next.handle().pipe(
      map((data: any) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse();
        const statusCode = response.statusCode;

        // If controller returned { message, ... }, use it
        let message = 'Request successful';
        let payload = data;

        if (data && typeof data === 'object' && 'message' in data) {
          message = data.message;
          // remove message from data so it doesn't duplicate
          const { message: _msg, ...rest } = data;
          payload = rest;
        }

        return {
          code: statusCode,
          status: 'success',
          message,
          data: payload ?? null,
        };
      }),
    );
  }
}
