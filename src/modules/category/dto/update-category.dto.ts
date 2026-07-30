import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { ArrayUnique, IsArray, IsMongoId, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { IBrand } from 'src/common/interfaces';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
export class UpdateCategoryParamsDto {
  @ArrayUnique()
  @IsMongoId({ each: true })
  @IsArray()
  @IsOptional()
  removeBrandIds?: Types.ObjectId[] | IBrand[] | undefined;

  @IsMongoId()
  categoryId!: Types.ObjectId | string;
}
