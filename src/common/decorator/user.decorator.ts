import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { HydratedUserDocument } from 'src/model';
import { CTXType, IAuthReq } from '../interfaces';

export const User = createParamDecorator(
  (data: unknown, context: ExecutionContext) => {
    let user!: HydratedUserDocument;

    switch (context.getType<CTXType>()) {
      case 'http':
        user = context.switchToHttp().getRequest().credentials.user;
        break;

      case 'graphql':
        user = (
          GqlExecutionContext.create(context).getContext().req as IAuthReq
        ).credentials.user;
        break;

      default:
        break;
    }

    return user;
  },
);
