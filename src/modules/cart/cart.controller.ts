import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AuthenticationGuard } from 'src/common/guard';
import { CreateCartDto } from './dto/create-cart.dto';
import { TTL, User } from 'src/common/decorator';
import type { HydratedUserDocument } from 'src/model';
import { ICart } from 'src/common/interfaces';
import { RemoveItemsFromCartDto } from './dto/update-cart.dto';
import { CustomCartCacheInterceptor } from 'src/common/interceptor';

@Controller('cart')
@UseGuards(AuthenticationGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  async create(
    @Body() createCartDto: CreateCartDto,
    @User() user: HydratedUserDocument,
  ): Promise<ICart> {
    return await this.cartService.create(createCartDto, user);
  }

  @Patch('remove-items')
  async removeItemsFromCart(
    @Body() removeItemsFromCartDto: RemoveItemsFromCartDto,
    @User() user: HydratedUserDocument,
  ): Promise<ICart> {
    return await this.cartService.removeItemsFromCart(
      removeItemsFromCartDto,
      user,
    );
  }

  @Delete()
  async remove(@User() user: HydratedUserDocument) {
    return await this.cartService.remove(user);
  }

  @Get()
  @UseInterceptors(CustomCartCacheInterceptor)
  @TTL(60)
  async findOne(@User() user: HydratedUserDocument) {
    return await this.cartService.findOne(user);
  }
}
