import { IsMongoId, IsNumber } from 'class-validator';
import { Types } from 'mongoose';
import { ICartProduct } from 'src/common/interfaces';

export class CreateCartDto implements Partial<ICartProduct> {
  @IsMongoId()
  productId!: Types.ObjectId;

  @IsNumber()
  quantity!: number;
}
