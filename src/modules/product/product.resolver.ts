import { IPaginate } from './../../common/interfaces/pagination.interface';
import { ProductService } from './product.service';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  PaginateProductsResponse,
  SayHiResponse,
} from './entities/product.entity';
import { SayHiInputDto } from './dto/create-product.dto';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import type { HydratedUserDocument } from 'src/model';
import { PaginateGQLDTO } from 'src/common/dto';
import { IProduct } from 'src/common/interfaces';
import { UseInterceptors } from '@nestjs/common';
import { CustomCacheInterceptor } from 'src/common/interceptor';

@Resolver()
export class ProductResolver {
  constructor(private readonly productService: ProductService) {}

  @UseInterceptors(CustomCacheInterceptor)
  @Query(() => PaginateProductsResponse)
  async allProducts(
    @Args() args: PaginateGQLDTO,
  ): Promise<IPaginate<IProduct>> {
    console.log('IN');
    const result = await this.productService.findAll(args);
    return result;
  }
}
