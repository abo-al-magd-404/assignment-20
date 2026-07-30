import { Types } from 'mongoose';
import { IUser } from './user.interface';

export interface IBrand {
  name: string;
  slug: string;
  image: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
