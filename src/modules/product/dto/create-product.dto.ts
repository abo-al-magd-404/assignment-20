import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Types } from 'mongoose';
import { IsGTE } from 'src/common/decorator';
import { IProduct } from 'src/common/interfaces';

export class CreateProductDto implements Partial<IProduct> {
  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(5000)
  name!: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(2)
  @MaxLength(50000)
  description!: string;

  @IsPositive()
  @Transform(({ value }) => Number(value))
  @Min(0)
  stock!: number;

  @IsPositive()
  @Transform(({ value }) => Number(value))
  @Min(0)
  originalPrice!: number;

  @IsPositive()
  @Transform(({ value }) => Number(value))
  @Min(0)
  @IsGTE(['originalPrice'])
  salePrice!: number;

  @IsPositive()
  @Transform(({ value }) => Number(value))
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercent?: number;

  @IsMongoId()
  categoryId!: Types.ObjectId;

  @IsMongoId()
  brandId!: Types.ObjectId;
}

@ArgsType()
export class SayHiInputDto {
  @IsString()
  @Field(() => String, { nullable: true })
  @IsOptional()
  name?: string;

  @IsOptional()
  @IsInt()
  @Field(() => Int, { nullable: true })
  age?: number;
}
