import { Field, ID, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import {
  GenderEnum,
  LanguageEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/common/enum';
import { IUser } from 'src/common/interfaces';

registerEnumType(GenderEnum, { name: 'GenderEnum' });
registerEnumType(ProviderEnum, { name: 'ProviderEnum' });
registerEnumType(RoleEnum, { name: 'RoleEnum' });
registerEnumType(LanguageEnum, { name: 'LanguageEnum' });

@ObjectType()
export class OneUserResponse implements Partial<IUser> {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field(() => String, { nullable: false })
  firstName!: string;
  @Field(() => String, { nullable: false })
  lastName!: string;
  @Field(() => String, { nullable: false })
  username?: string;

  @Field(() => String, { nullable: false })
  email!: string;
  @Field(() => String, { nullable: true })
  password?: string | undefined;
  @Field(() => String, { nullable: true })
  phone?: string | undefined;
  @Field(() => String, { nullable: true })
  profilePicture?: string | undefined;
  @Field(() => [String], { nullable: true })
  profileCoverPictures?: string[] | undefined;
  @Field(() => LanguageEnum)
  lang!: LanguageEnum;

  @Field(() => GenderEnum)
  gender!: GenderEnum;
  @Field(() => RoleEnum)
  role!: RoleEnum;
  @Field(() => ProviderEnum)
  provider!: ProviderEnum;

  @Field(() => String, { nullable: true })
  changeCredentialsTime?: Date | undefined;
  @Field(() => String, { nullable: true })
  DOB?: Date | undefined;
  @Field(() => String, { nullable: true })
  confirmEmail?: Date | undefined;

  @Field(() => String, { nullable: true })
  createdAt?: Date | undefined;
  @Field(() => String, { nullable: false })
  updatedAt!: Date | undefined;
  @Field(() => String, { nullable: true })
  deletedAt?: Date | undefined;
  @Field(() => String, { nullable: true })
  restoredAt?: Date | undefined;
}
