import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandModel, CategoryModel } from 'src/model';
import { BrandRepository, CategoryRepository } from 'src/common/repository';
import { CloudinaryService } from 'src/common/service';

@Module({
  imports: [CategoryModel, BrandModel],
  controllers: [CategoryController],
  providers: [
    CategoryService,
    CategoryRepository,
    BrandRepository,
    CloudinaryService,
  ],
})
export class CategoryModule {}
