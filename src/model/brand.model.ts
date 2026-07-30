import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IBrand, IUser } from 'src/common/interfaces';
import { generateSlug } from 'src/common/utils';

export type HydratedBrandDocument = HydratedDocument<IBrand>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Brands',
})
export class Brand implements IBrand {
  @Prop({
    type: String,
    required: true,
    unique: true,
    minLength: 2,
    maxLength: 50,
  })
  name!: string;

  @Prop({
    type: String,
  })
  slug!: string;

  @Prop({
    type: String,
  })
  image!: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId | IUser;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId | IUser;

  // @Prop({ type: Date })
  // createdAt?: Date | undefined;

  // @Prop({ type: Date })
  // updatedAt?: Date | undefined;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;

  @Prop({ type: Date })
  restoredAt?: Date | undefined;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

// export const BrandModel = MongooseModule.forFeature([
//   { name: Brand.name, schema: BrandSchema },
// ]);

export const BrandModel = MongooseModule.forFeatureAsync([
  {
    name: Brand.name,
    useFactory: () => {
      // FIND & FIND-ONE
      BrandSchema.pre(['find', 'findOne'], function () {
        if (this.getQuery().paranoid !== false) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: false },
          });
        }
      });

      // UPDATE-ONE & FIND-ONE-AND-UPDATE
      BrandSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        const update = this.getUpdate() as HydratedDocument<IBrand>;

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
      BrandSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        if (this.getQuery().force !== true) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: true },
          });
        }
      });

      BrandSchema.pre(
        'save',
        function (this: HydratedDocument<IBrand> & { wasNew: boolean }) {
          if (this.isModified('name')) {
            this.slug = generateSlug(this.name);
          }
        },
      );

      return BrandSchema;
    },
  },
]);
