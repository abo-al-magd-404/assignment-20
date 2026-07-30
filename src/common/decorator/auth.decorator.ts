import { applyDecorators, UseGuards } from '@nestjs/common';
import { Token } from './token.decorator';
import { Role } from './role.decorator';
import { RoleEnum, TokenTypeEnum } from '../enum';
import { AuthenticationGuard, AuthorizationGuard } from '../guard';

export const Auth = (
  roles: RoleEnum[],
  type: TokenTypeEnum = TokenTypeEnum.ACCESS,
) => {
  return applyDecorators(
    UseGuards(AuthenticationGuard, AuthorizationGuard),
    Token(type),
    Role(roles),
  );
};
