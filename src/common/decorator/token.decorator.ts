import { SetMetadata } from '@nestjs/common';
import { TokenTypeEnum } from '../enum';

export const tokenTypeName = 'tokenType';
export const Token = (tokenType: TokenTypeEnum = TokenTypeEnum.ACCESS) => {
  return SetMetadata(tokenTypeName, tokenType);
};
