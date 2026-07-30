import { Types } from 'mongoose';
import { IUser } from './user.interface';
import { IBrand } from './brand.interface';

export interface ICategory {
  name: string;
  slug: string;
  image: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  brandIds?: Types.ObjectId[] | IBrand[];

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
