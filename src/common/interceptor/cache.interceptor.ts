import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../service';
import { Reflector } from '@nestjs/core';
import { ttlName } from '../decorator';
import { CTXType, IAuthReq } from '../interfaces';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class CustomCacheInterceptor implements NestInterceptor {
  constructor(
    private readonly redis: CacheService,
    private readonly reflector: Reflector,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    let url = '';
    let userId: string | undefined;

    switch (context.getType<CTXType>()) {
      case 'http': {
        const req: IAuthReq = context.switchToHttp().getRequest();
        url = req.url;
        userId = req.credentials?.user?._id?.toString();
        break;
      }

      case 'graphql': {
        const gqlContext = GqlExecutionContext.create(context);
        const ctx = gqlContext;
        url = JSON.stringify({
          key: ctx.getInfo().path.key,
          typename: ctx.getInfo().path.typename,
          args: ctx.getArgs(),
        });
        break;
      }

      default:
        break;
    }

    const cacheKey = `Request::${url}${userId ? `::User:${userId}` : ''}`;
    console.log({ cacheKey });
    const data = await this.redis.get(cacheKey);

    if (data) {
      return of(data);
    }

    return next.handle().pipe(
      tap((value: unknown) => {
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
