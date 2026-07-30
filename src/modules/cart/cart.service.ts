import { CreateCartDto } from './dto/create-cart.dto';
import { ProductRepository } from 'src/common/repository';
import { CartRepository } from './../../common/repository/cart.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import type { HydratedUserDocument } from 'src/model';
import { toObjectId } from 'src/common/utils';
import { ICart } from 'src/common/interfaces';
import { RemoveItemsFromCartDto } from './dto/update-cart.dto';
import { CacheService, cartCacheKey } from 'src/common/service';

@Injectable()
export class CartService {
  constructor(
    private readonly redis: CacheService,
    private readonly CartRepository: CartRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  private async clearCartCache(user: HydratedUserDocument) {
    await this.redis.deleteKey(cartCacheKey(user));
  }

  async create(
    { productId, quantity }: CreateCartDto,
    user: HydratedUserDocument,
  ): Promise<ICart> {
    productId = toObjectId(productId as unknown as string);

    const product = await this.productRepository.findOne({
      filter: { _id: productId, stock: { $gte: quantity } },
    });

    if (!product) throw new NotFoundException('This Product Out Of Stock');

    const cart = await this.CartRepository.findOne({
      filter: { userId: user._id },
    });

    if (!cart) {
      await this.clearCartCache(user);

      return await this.CartRepository.createOne({
        data: {
          userId: user._id,
          products: [{ productId, quantity: quantity < 1 ? 1 : quantity }],
        },
      });
    }

    let matched: boolean = false;

    for (const item of cart.products || []) {
      if (item.productId.toString() === productId.toString()) {
        const updatedQuantity = item.quantity + quantity;

        item.quantity = updatedQuantity > 0 ? updatedQuantity : 1;
        matched = true;
      }
    }

    if (!matched) {
      cart.products.push({
        productId,
        quantity: quantity < 1 ? 1 : quantity,
      });
    }

    await this.clearCartCache(user);
    return await cart.save();
  }

  async removeItemsFromCart(
    { productIds = [] }: RemoveItemsFromCartDto,
    user: HydratedUserDocument,
  ): Promise<ICart> {
    productIds = productIds.map((ele) => toObjectId(ele as unknown as string));

    const cart = await this.CartRepository.findOneAndUpdate({
      filter: { userId: user._id },
      update: {
        $pull: { products: { productId: { $in: productIds } } },
      },
    });

    if (!cart) {
      throw new NotFoundException('Cart not exist');
    }

    await this.clearCartCache(user);
    return cart.toJSON();
  }

  async remove(user: HydratedUserDocument) {
    const result = await this.CartRepository.deleteOne({
      filter: { userId: user._id },
    });
    await this.clearCartCache(user);
    return result;
  }

  async findOne(user: HydratedUserDocument): Promise<ICart> {
    const cart = await this.CartRepository.findOne({
      filter: { userId: user._id },
      options: {
        populate: [{ path: 'products.productId' }],
      },
    });

    if (!cart) {
      return { userId: user._id, products: [] };
    }

    return cart.toJSON();
  }
}
