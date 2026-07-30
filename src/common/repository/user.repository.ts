import { InjectModel } from '@nestjs/mongoose';
import { IUser } from '../interfaces';
import { DatabaseRepository } from './base.repository';
import { User } from 'src/model';
import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserRepository extends DatabaseRepository<IUser> {
  constructor(@InjectModel(User.name) protected readonly model: Model<IUser>) {
    super(model);
  }
}
