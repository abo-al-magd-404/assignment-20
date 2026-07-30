import { InjectModel } from '@nestjs/mongoose';
import { ICart } from '../interfaces';
import { DatabaseRepository } from './base.repository';
import { Cart } from 'src/model';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CartRepository extends DatabaseRepository<ICart> {
  constructor(@InjectModel(Cart.name) protected readonly model: Model<ICart>) {
    super(model);
  }
}
