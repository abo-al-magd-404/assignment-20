import { Types } from 'mongoose';
import { IUser } from './user.interface';
import { IProduct } from './product.interface';

export interface ICartProduct {
  productId: Types.ObjectId | IProduct;
  quantity: number;
}

export interface ICart {
  userId: Types.ObjectId | IUser;
  products: ICartProduct[];
}
