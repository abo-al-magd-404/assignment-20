import { InjectModel } from '@nestjs/mongoose';
import { IBrand } from '../interfaces';
import { DatabaseRepository } from './base.repository';
import { Brand } from 'src/model';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BrandRepository extends DatabaseRepository<IBrand> {
  constructor(
    @InjectModel(Brand.name) protected readonly model: Model<IBrand>,
  ) {
    super(model);
  }
}
