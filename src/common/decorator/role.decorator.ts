import { SetMetadata } from '@nestjs/common';
import { RoleEnum } from '../enum';

export const roleName = 'Roles';
export const Role = (roles: RoleEnum[]) => {
  return SetMetadata(roleName, roles);
};
