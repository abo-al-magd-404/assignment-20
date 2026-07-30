import { PartialType } from '@nestjs/mapped-types';
import { CreateBrandDto } from './create-brand.dto';
import { IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
export class UpdateBrandParamsDto {
  @IsMongoId()
  brandId!: Types.ObjectId | string;
}
