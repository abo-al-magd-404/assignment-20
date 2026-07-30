import { GenderEnum, LanguageEnum, ProviderEnum, RoleEnum } from '../enum';

export interface IUser {
  firstName: string;
  lastName: string;
  username?: string;

  email: string;
  password: string;
  phone?: string | undefined;
  profilePicture?: string;
  profileCoverPictures?: string[];
  lang: LanguageEnum;

  gender: GenderEnum;
  role: RoleEnum;
  provider: ProviderEnum;

  changeCredentialsTime?: Date;
  DOB?: Date;
  confirmEmail?: Date;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
