import { ArrayUnique, IsArray, IsMongoId } from 'class-validator';
import { Types } from 'mongoose';

export class RemoveItemsFromCartDto {
  @IsMongoId({ each: true })
  @IsArray()
  @ArrayUnique()
  productIds!: Types.ObjectId[];
}
