import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { IAuthReq } from '../interfaces';

@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    switch (context.getType()) {
      case 'http': {
        const req = context.switchToHttp().getRequest() as IAuthReq;
        req.headers['accept-language'] ??= req.credentials?.user?.lang ?? 'en';
        break;
      }

      default:
        break;
    }

    return next.handle().pipe();
  }
}
