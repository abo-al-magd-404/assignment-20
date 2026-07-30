import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IBrand, ICategory, IProduct, IUser } from 'src/common/interfaces';
import { generateSlug } from 'src/common/utils';

export type HydratedProductDocument = HydratedDocument<IProduct>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Products',
})
export class Product implements IProduct {
  // notifyUsers?: Types.ObjectId[] | IUser[];

  // createdBy: Types.ObjectId | IUser;
  // updatedBy?: Types.ObjectId | IUser;

  // createdAt?: Date;
  // updatedAt?: Date;
  // deletedAt?: Date;
  // restoredAt?: Date;
  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 50,
  })
  name!: string;

  @Prop({
    type: String,
    required: true,
    minLength: 2,
    maxLength: 50000,
  })
  description!: string;

  @Prop({
    type: String,
  })
  slug!: string;

  @Prop({
    type: String,
    required: true,
  })
  productId!: string;

  @Prop({
    type: String,
  })
  image!: string;

  @Prop({
    type: [String],
  })
  gallery!: string[];

  @Prop({ type: Number, required: true, min: 0 })
  stock!: number;
  @Prop({ type: Number, min: 0, max: 5 })
  rating?: number;

  @Prop({ type: Number, required: true, min: 0 })
  originalPrice!: number;

  @Prop({ type: Number, required: true, min: 0 })
  salePrice!: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  discountPercent!: number;

  @Prop({ type: Number, required: true, min: 0 })
  finalPrice!: number;

  @Prop({ type: Types.ObjectId, ref: 'Categories', required: true })
  categoryId!: Types.ObjectId | ICategory;

  @Prop({ type: Types.ObjectId, ref: 'Brands', required: true })
  brandId!: Types.ObjectId | IBrand;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  notifyUsers?: Types.ObjectId[] | IUser[] | undefined;

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

export const ProductSchema = SchemaFactory.createForClass(Product);

// export const ProductModel = MongooseModule.forFeature([
//   { name: Product.name, schema: ProductSchema },
// ]);

export const ProductModel = MongooseModule.forFeatureAsync([
  {
    name: Product.name,
    useFactory: () => {
      // FIND & FIND-ONE
      ProductSchema.pre(['find', 'findOne'], function () {
        if (this.getQuery().paranoid !== false) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: false },
          });
        }
      });

      // UPDATE-ONE & FIND-ONE-AND-UPDATE
      ProductSchema.pre(['updateOne', 'findOneAndUpdate'], function () {
        const update = this.getUpdate() as HydratedDocument<IProduct>;

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
      ProductSchema.pre(['deleteOne', 'findOneAndDelete'], function () {
        if (this.getQuery().force !== true) {
          this.setQuery({
            ...this.getQuery(),
            deletedAt: { $exists: true },
          });
        }
      });

      ProductSchema.pre(
        'save',
        function (this: HydratedDocument<IProduct> & { wasNew: boolean }) {
          if (this.isModified('name')) {
            this.slug = generateSlug(this.name);
          }
        },
      );

      return ProductSchema;
    },
  },
]);
