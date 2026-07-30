import { BadRequestException } from '@nestjs/common';
import {
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
  Virtual,
} from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import {
  GenderEnum,
  LanguageEnum,
  ProviderEnum,
  RoleEnum,
} from 'src/common/enum';
import { IUser } from 'src/common/interfaces';
import { SecurityModule } from 'src/common/modules/security/security.module';
import { SecurityService } from 'src/common/modules/security/security.service';

export type HydratedUserDocument = HydratedDocument<IUser>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Users',
})
export class User implements IUser {
  // Basic Name and ID Data
  @Prop({ type: String, required: true })
  firstName!: string;

  @Prop({ type: String, required: true })
  lastName!: string;

  @Virtual({
    set: function (this: HydratedUserDocument, value: string) {
      const [firstName, lastName] = value.split(' ') || [];
      this.set({ firstName, lastName });
    },
    get: function (this: HydratedUserDocument) {
      return `${this.firstName} ${this.lastName}`;
    },
  })
  username?: string | undefined;

  @Prop({ type: Number, enum: GenderEnum, default: GenderEnum.MALE })
  gender!: GenderEnum;

  @Prop({ type: Date })
  DOB?: Date;

  @Prop({ type: String, enum: LanguageEnum, default: LanguageEnum.EN })
  lang!: LanguageEnum;

  // Contact Information
  @Prop({ type: String, required: true, unique: true })
  email!: string;

  @Prop({ type: String, required: false })
  phone?: string;

  // Account, Security, and Permissions Data
  @Prop({
    type: String,
    required: function (this: HydratedUserDocument) {
      return this.provider == ProviderEnum.SYSTEM;
    },
  })
  password!: string;

  @Prop({ type: Number, enum: RoleEnum, default: RoleEnum.USER })
  role!: RoleEnum;

  @Prop({
    type: Number,
    enum: ProviderEnum,
    default: ProviderEnum.SYSTEM,
  })
  provider!: ProviderEnum;

  // Profile Pictures
  @Prop({ type: String, required: false })
  profilePicture?: string;

  @Prop({ type: [String], required: false })
  profileCoverPictures?: string[];

  // Date Fields and Account Status
  @Prop({ type: Date })
  confirmEmail?: Date;

  @Prop({ type: Date })
  changeCredentialsTime?: Date;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Date })
  restoredAt?: Date;
}

export const userSchema = SchemaFactory.createForClass(User);

// export const userModel = MongooseModule.forFeature([
//   { name: User.name, schema: userSchema },
// ]);

export const UserModel = MongooseModule.forFeatureAsync([
  {
    name: User.name,
    imports: [SecurityModule],
    useFactory: (securityService: SecurityService) => {
      // FIND & FIND-ONE
      userSchema.pre(['find', 'findOne'], function () {
        if (this.getQuery().paranoid !== false) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: false },
          });
        }
      });

      // UPDATE-ONE & FIND-ONE-AND-UPDATE
      userSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        const update = this.getUpdate() as HydratedDocument<IUser>;

        if (update.deletedAt) {
          this.getQuery().paranoid = true;
          this.setUpdate({
            ...this.getUpdate(),
            $unset: { restoredAt: 1 },
          });
        }

        if (update.restoredAt) {
          this.setQuery({
            ...this.getQuery(),
            paranoid: false,
            deletedAt: { $exists: true },
          });
          this.setUpdate({
            ...this.getUpdate(),
            $unset: { deletedAt: 1 },
          });
        }

        if (this.getQuery().paranoid !== false) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: false },
          });
        }

        console.log(this.getQuery());
      });

      // DELETE-ONE & FIND-ONE-AND-DELETE
      userSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        if (this.getQuery().force !== true) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: true },
          });
        }
      });

      userSchema.pre(
        'save',
        async function (this: HydratedDocument<IUser> & { wasNew: boolean }) {
          this.wasNew = this.isNew;

          if (this.isModified('password')) {
            this.password = await securityService.generateHash({
              plaintext: this.password,
            });
          }
          if (this.phone && this.isModified('phone')) {
            this.phone = await securityService.generateEncryption(this.phone);
          }
        },
      );

      userSchema.pre('validate', function () {
        // console.log({ this: this });

        if (this.password && this.provider === ProviderEnum.GOOGLE) {
          throw new BadRequestException('Google account cannot hold password');
        }

        // if (!this.slug || this.slug.includes(' ')) {
        //   throw new BadRequestException('Invalid slug format');
        // }
      });

      userSchema.post('validate', function () {
        // console.log('Validate post', { this: this });
      });

      return userSchema;
    },
    inject: [SecurityService],
  },
]);
