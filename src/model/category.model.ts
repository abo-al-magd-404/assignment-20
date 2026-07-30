import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IBrand, ICategory, IUser } from 'src/common/interfaces';
import { generateSlug } from 'src/common/utils';

export type HydratedCategoryDocument = HydratedDocument<ICategory>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Categories',
})
export class Category implements ICategory {
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

  @Prop([{ type: Types.ObjectId, ref: 'Brands' }])
  brandIds?: Types.ObjectId[] | IBrand[];

  // @Prop({ type: Date })
  // createdAt?: Date | undefined;

  // @Prop({ type: Date })
  // updatedAt?: Date | undefined;

  @Prop({ type: Date })
  deletedAt?: Date | undefined;

  @Prop({ type: Date })
  restoredAt?: Date | undefined;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// export const CategoryModel = MongooseModule.forFeature([
//   { name: Category.name, schema: CategorySchema },
// ]);

export const CategoryModel = MongooseModule.forFeatureAsync([
  {
    name: Category.name,
    useFactory: () => {
      // FIND & FIND-ONE
      CategorySchema.pre(['find', 'findOne'], function () {
        if (this.getQuery().paranoid !== false) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: false },
          });
        }
      });

      // UPDATE-ONE & FIND-ONE-AND-UPDATE
      CategorySchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        const update = this.getUpdate() as HydratedDocument<ICategory>;

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
      CategorySchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        if (this.getQuery().force !== true) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: true },
          });
        }
      });

      CategorySchema.pre(
        'save',
        function (this: HydratedDocument<ICategory> & { wasNew: boolean }) {
          if (this.isModified('name')) {
            this.slug = generateSlug(this.name);
          }
        },
      );

      return CategorySchema;
    },
  },
]);
