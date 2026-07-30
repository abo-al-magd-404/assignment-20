import { InjectModel } from '@nestjs/mongoose';
import { IProduct } from '../interfaces';
import { DatabaseRepository } from './base.repository';
import { Product } from 'src/model';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductRepository extends DatabaseRepository<IProduct> {
  constructor(
    @InjectModel(Product.name) protected readonly model: Model<IProduct>,
  ) {
    super(model);
  }
}
