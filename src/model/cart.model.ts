import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ICart, ICartProduct } from 'src/common/interfaces';

export type HydratedCartDocument = HydratedDocument<ICart>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  strict: true,
  strictQuery: true,
  collection: 'Carts',
})
export class Cart implements ICart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop([
    raw({
      productId: { type: Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, min: 1, default: 1 },
    }),
  ])
  products!: ICartProduct[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);

export const CartModel = MongooseModule.forFeature([
  { name: Cart.name, schema: CartSchema },
]);
