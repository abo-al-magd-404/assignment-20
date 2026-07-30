import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService, cartCacheKey } from '../service';
import { Reflector } from '@nestjs/core';
import { ttlName } from '../decorator';
import { IAuthReq } from '../interfaces';

@Injectable()
export class CustomCartCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req: IAuthReq = context.switchToHttp().getRequest();
    const url = context.switchToHttp().getRequest().url;
    console.log({ url });

    const cacheKey = cartCacheKey(req.credentials.user);
    const data = await this.redis.get(cacheKey);

    if (data) {
      return of(data);
    }

    return next.handle().pipe(
      tap((value: unknown) => {
        console.log('IN');
        const ttl =
          this.reflector.getAllAndOverride<number>(ttlName, [
            context.getClass(),
            context.getHandler(),
          ]) ?? 10;
        void this.redis.set({ key: cacheKey, value, ttl });
      }),
    );
  }
}
