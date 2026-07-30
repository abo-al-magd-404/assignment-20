import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { CTXType, IAuthReq } from '../interfaces';
import { Reflector } from '@nestjs/core';
import { RoleEnum, TokenTypeEnum } from '../enum';
import { roleName } from '../decorator';
import { HydratedUserDocument } from 'src/model';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles =
      this.reflector.getAllAndOverride<RoleEnum[]>(roleName, [
        context.getHandler(),
        context.getClass(),
      ]) ?? TokenTypeEnum.ACCESS;

    let user!: HydratedUserDocument;

    switch (context.getType<CTXType>()) {
      case 'http':
        user = (context.switchToHttp().getRequest() as IAuthReq).credentials
          .user;
        break;

      case 'graphql':
        user = (
          GqlExecutionContext.create(context).getContext().req as IAuthReq
        ).credentials.user;
        break;

      default:
        break;
    }

    return roles.includes(user.role);
  }
}
