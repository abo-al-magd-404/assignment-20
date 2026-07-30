import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class PaginateDTO {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @IsOptional()
  size?: number;

  @IsString()
  @IsOptional()
  search?: string;
}

@ArgsType()
export class PaginateGQLDTO {
  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Field(() => Int, { nullable: true })
  @IsInt()
  @Min(1)
  @IsOptional()
  size?: number;

  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  search?: string;
}
