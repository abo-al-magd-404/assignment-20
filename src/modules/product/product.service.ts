import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { CloudinaryService } from 'src/common/service';
import {
  BrandRepository,
  CategoryRepository,
  ProductRepository,
} from 'src/common/repository';
import type { HydratedUserDocument } from 'src/model';
import type { IFile, IPaginate, IProduct } from 'src/common/interfaces';
import { generateSlug, toObjectId } from 'src/common/utils';
import { randomUUID } from 'crypto';
import {
  UpdateProductDto,
  UpdateProductParamsDto,
} from './dto/update-product.dto';
import { PaginateDTO } from 'src/common/dto';

@Injectable()
export class ProductService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly brandRepository: BrandRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly productRepository: ProductRepository,
  ) {}

  async create(
    {
      brandId,
      categoryId,
      description,
      name,
      originalPrice,
      salePrice,
      stock,
      discountPercent = 0,
    }: CreateProductDto,
    user: HydratedUserDocument,
    files: { image: IFile[]; gallery?: IFile[] },
  ): Promise<IProduct> {
    const parsedBrandId = toObjectId(brandId as unknown as string);
    const parsedCategoryId = toObjectId(categoryId as unknown as string);

    const category = await this.categoryRepository.findOne({
      filter: { _id: parsedCategoryId },
    });
    if (!category) throw new NotFoundException('Category Not Exists');

    const brand = await this.brandRepository.findOne({
      filter: { _id: parsedBrandId },
    });
    if (!brand) throw new NotFoundException('Brand Not Exists');

    const finalPrice = Number(
      (salePrice - (salePrice * discountPercent) / 100).toFixed(2),
    );

    const productId: string = randomUUID().slice(0, 6);

    const { Key: mainImageKey } = await this.cloudinaryService.uploadAsset({
      file: files.image[0],
      path: `Products/${productId}`,
    });

    let galleryKeys: string[] = [];

    if (files.gallery?.length) {
      const galleryUploads = await this.cloudinaryService.uploadAssets({
        files: files.gallery,
        path: `Products/${productId}/gallery`,
      });

      galleryKeys = galleryUploads;
    }

    const product = await this.productRepository.createOne({
      data: {
        brandId: parsedBrandId,
        categoryId: parsedCategoryId,
        description,
        name,
        originalPrice,
        salePrice,
        finalPrice,
        stock,
        discountPercent,
        productId,
        image: mainImageKey,
        gallery: galleryKeys,
        createdBy: user._id,
      },
    });

    if (!product) {
      await this.cloudinaryService.deleteFolderByPrefix({
        prefix: `Products/${productId}`,
      });
      throw new BadRequestException('Fail to create this product');
    }

    return product.toJSON();
  }

  private async deleteAttachments(gallery: string[] = [], image?: string) {
    const keys: { key: string }[] = [];

    if (image) {
      keys.push({ key: image });
    }

    if (gallery.length) {
      keys.push(...gallery.map((ele) => ({ key: ele })));
    }

    if (keys.length) {
      await this.cloudinaryService.deleteAssets({ keys });
    }
  }

  async update(
    { productId }: UpdateProductParamsDto,
    {
      removeGallery = [],
      brandId,
      categoryId,
      description,
      name,
      originalPrice,
      salePrice,
      stock,
      discountPercent,
    }: UpdateProductDto,
    user: HydratedUserDocument,
    files?: { image?: IFile[]; gallery?: IFile[] },
  ): Promise<IProduct> {
    const parsedProductId = toObjectId(productId as unknown as string);

    const product = await this.productRepository.findOne({
      filter: { _id: parsedProductId },
    });

    if (!product) throw new NotFoundException('Product Not Exists');

    if (brandId) {
      const brand = await this.brandRepository.findOne({
        filter: { _id: toObjectId(brandId as unknown as string) },
      });
      if (!brand) throw new NotFoundException('Brand Not Exists');
    }

    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        filter: { _id: toObjectId(categoryId as unknown as string) },
      });
      if (!category) throw new NotFoundException('Category Not Exists');
    }

    let finalPrice: number = product.finalPrice;
    const currentOriginalPrice = originalPrice ?? product.originalPrice;
    const currentSalePrice = salePrice ?? product.salePrice;
    const currentDiscountPercent = discountPercent ?? product.discountPercent;

    if (
      salePrice !== undefined ||
      originalPrice !== undefined ||
      discountPercent !== undefined
    ) {
      if (currentSalePrice > currentOriginalPrice) {
        throw new BadRequestException(
          "Sale price can't be greater than original price",
        );
      }

      finalPrice = Number(
        (
          currentSalePrice -
          (currentSalePrice * currentDiscountPercent) / 100
        ).toFixed(2),
      );
    }

    let newImageKey: string | undefined;

    if (files?.image?.length) {
      const { Key } = await this.cloudinaryService.uploadAsset({
        file: files.image[0],
        path: `Products/${product.productId}`,
      });
      newImageKey = Key;
    }

    let newGalleryKeys: string[] = [];

    if (files?.gallery?.length) {
      newGalleryKeys = await this.cloudinaryService.uploadAssets({
        files: files.gallery,
        path: `Products/${product.productId}/gallery`,
      });
    }

    const updatedProduct = await this.productRepository.findOneAndUpdate({
      filter: { _id: parsedProductId },
      update: [
        {
          $set: {
            ...(name ? { name, slug: generateSlug(name) } : {}),
            ...(description ? { description } : {}),
            ...(brandId
              ? { brandId: toObjectId(brandId as unknown as string) }
              : {}),
            ...(categoryId
              ? { categoryId: toObjectId(categoryId as unknown as string) }
              : {}),
            ...(stock !== undefined ? { stock } : {}),
            originalPrice: currentOriginalPrice,
            discountPercent: currentDiscountPercent,
            salePrice: currentSalePrice,
            finalPrice,
            ...(newImageKey ? { image: newImageKey } : {}),
            gallery: {
              $setUnion: [
                {
                  $setDifference: ['$gallery', removeGallery],
                },
                newGalleryKeys,
              ],
            },
            updatedBy: user._id,
          },
        },
      ],
      options: { new: true },
    });

    if (!updatedProduct) {
      await this.deleteAttachments(newGalleryKeys, newImageKey);
      throw new BadRequestException('Fail to update this product');
    }

    await this.deleteAttachments(
      removeGallery,
      newImageKey ? product.image : undefined,
    );

    return updatedProduct.toJSON();
  }

  async findAll({
    page,
    size,
    search,
  }: PaginateDTO): Promise<IPaginate<IProduct>> {
    const result = await this.productRepository.paginate({
      page,
      size,
      filter: {
        ...(search
          ? {
              $or: [
                { name: { $regex: search, options: 'i' } },
                { slug: { $regex: search, options: 'i' } },
                { description: { $regex: search, options: 'i' } },
              ],
            }
          : {}),
      },
      options: {
        populate: [{ path: 'createdBy' }],
      },
    });
    return result;
  }
}
