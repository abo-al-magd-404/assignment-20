import { Field, Float, ID, Int, ObjectType } from '@nestjs/graphql';
import { Types } from 'mongoose';
import type { IBrand, ICategory, IProduct, IUser } from 'src/common/interfaces';
import { OneUserResponse } from 'src/modules/user/entities/user.entity';

export class Product {}

@ObjectType()
export class SayHiResponse {
  @Field(() => String, { nullable: false })
  message!: string;

  @Field(() => Int, { nullable: true })
  age?: number;
}

@ObjectType()
export class OneProductResponse implements Partial<IProduct> {
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field(() => String)
  name!: string;
  @Field(() => String)
  description!: string;
  @Field(() => String)
  slug!: string;
  @Field(() => String)
  productId!: string;

  @Field(() => String)
  image!: string;
  @Field(() => [String], { nullable: true })
  gallery?: string[] | undefined;

  @Field(() => Int)
  stock!: number;
  @Field(() => Int, { nullable: true })
  rating?: number | undefined;

  @Field(() => Float)
  originalPrice!: number;
  @Field(() => Float)
  salePrice!: number;
  @Field(() => Float)
  discountPercent!: number;
  @Field(() => Float)
  finalPrice!: number;

  @Field(() => ID)
  categoryId!: Types.ObjectId | ICategory;
  @Field(() => ID)
  brandId!: Types.ObjectId | IBrand;

  @Field(() => [ID], { nullable: true })
  notifyUsers?: Types.ObjectId[] | IUser[] | undefined;

  @Field(() => OneUserResponse)
  createdBy!: IUser;
  @Field(() => ID, { nullable: true })
  updatedBy?: Types.ObjectId | IUser | undefined;

  @Field(() => String)
  createdAt!: Date;
  @Field(() => String, { nullable: true })
  updatedAt?: Date;
  @Field(() => String, { nullable: true })
  deletedAt?: Date;
  @Field(() => String, { nullable: true })
  restoredAt?: Date;
}

@ObjectType()
export class PaginateProductsResponse {
  @Field(() => [OneProductResponse])
  docs!: IProduct[];

  @Field(() => Int, { nullable: true })
  currentPage?: number | undefined;

  @Field(() => Int, { nullable: true })
  pages?: number | undefined;

  @Field(() => Int, { nullable: true })
  size?: number | string;
}
