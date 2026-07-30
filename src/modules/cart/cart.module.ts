import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { CartModel, ProductModel } from 'src/model';
import { CartRepository } from 'src/common/repository/cart.repository';
import { ProductRepository } from 'src/common/repository';

@Module({
  imports: [CartModel, ProductModel],
  controllers: [CartController],
  providers: [CartService, CartRepository, ProductRepository],
})
export class CartModule {}
