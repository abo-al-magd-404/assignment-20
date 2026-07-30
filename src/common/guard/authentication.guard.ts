import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../service';
import { CTXType, IAuthReq } from '../interfaces';
import { Reflector } from '@nestjs/core';
import { TokenTypeEnum } from '../enum';
import { tokenTypeName } from '../decorator';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const tokenType =
        this.reflector.getAllAndOverride<TokenTypeEnum>(tokenTypeName, [
          context.getHandler(),
          context.getClass(),
        ]) ?? TokenTypeEnum.ACCESS;

      console.log({ tokenType });

      let req!: IAuthReq;
      let authorization!: string;

      switch (context.getType<CTXType>()) {
        case 'http':
          req = context.switchToHttp().getRequest();
          authorization = req.headers['authorization'] as string;
          break;

        case 'graphql':
          req = GqlExecutionContext.create(context).getContext().req;
          authorization = req.headers['authorization'] as string;
          break;

        default:
          break;
      }

      if (!authorization) {
        return false;
      }

      const [key, credential] = authorization?.split(' ') || [];

      if (!key || !credential) {
        throw new UnauthorizedException('missing authorization');
      }

      switch (key) {
        case 'Basic':
          {
            const [username, password] = Buffer.from(credential, 'base64')
              .toString()
              .split(':');

            console.log({ username, password });
          }
          break;

        default: {
          req.credentials = await this.tokenService.decodeToken({
            token: credential,
            tokenType,
          });

          break;
        }
      }

      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Bad Request';
      throw new BadRequestException(message);
    }
  }
}
