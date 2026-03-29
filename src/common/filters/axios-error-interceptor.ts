import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, catchError } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class AxiosErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((err: unknown) => {
        if (err instanceof AxiosError && err.response) {
          const responseData =
            typeof err.response.data === 'string' ||
            typeof err.response.data === 'object'
              ? err.response.data
              : { message: 'Erro no serviço', data: [], success: false };

          const status =
            typeof err.response.status === 'number'
              ? err.response.status
              : HttpStatus.BAD_GATEWAY;

          throw new HttpException(responseData, status);
        }

        if (err instanceof HttpException) {
          throw err;
        }

        throw new HttpException(
          { message: 'Serviço indisponível', data: [], success: false },
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }),
    );
  }
}
