import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { BrandModel, CategoryModel, ProductModel, UserModel } from 'src/model';
import {
  BrandRepository,
  CategoryRepository,
  ProductRepository,
  UserRepository,
} from 'src/common/repository';
import { CloudinaryService } from 'src/common/service';
import { ProductResolver } from './product.resolver';

@Module({
  imports: [ProductModel, CategoryModel, BrandModel, UserModel],
  controllers: [ProductController],
  providers: [
    ProductService,
    CategoryRepository,
    BrandRepository,
    UserRepository,
    ProductRepository,
    CloudinaryService,
    ProductResolver,
  ],
})
export class ProductModule {}
