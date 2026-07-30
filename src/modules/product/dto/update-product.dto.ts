import { ArrayUnique, IsArray, IsMongoId, IsString } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { Types } from 'mongoose';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ArrayUnique()
  @IsArray()
  @IsString({ each: true })
  removeGallery?: string[];
}

export class UpdateProductParamsDto {
  @IsMongoId()
  productId!: Types.ObjectId | string;
}
