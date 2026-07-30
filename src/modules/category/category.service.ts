import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import {
  UpdateCategoryDto,
  UpdateCategoryParamsDto,
} from './dto/update-category.dto';
import { CloudinaryService } from 'src/common/service';
import { BrandRepository, CategoryRepository } from 'src/common/repository';
import type { HydratedUserDocument } from 'src/model';
import { ICategory, IFile } from 'src/common/interfaces';
import { generateSlug, toObjectId } from 'src/common/utils';

@Injectable()
export class CategoryService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly brandRepository: BrandRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async create(
    { name, brandIds = [] }: CreateCategoryDto,
    user: HydratedUserDocument,
    file: IFile,
  ): Promise<ICategory> {
    const parsedBrandIds = brandIds.map((ele) => toObjectId(ele as string));

    const checkDuplicated = await this.categoryRepository.findOne({
      filter: { name, paranoid: false },
    });

    if (checkDuplicated) throw new ConflictException('Category Already Exists');

    if (
      parsedBrandIds.length !==
      (
        await this.brandRepository.find({
          filter: { _id: { $in: parsedBrandIds } },
        })
      ).length
    ) {
      throw new NotFoundException('Missing some or all mentioned brands');
    }

    const { Key } = await this.cloudinaryService.uploadAsset({
      file,
      path: `Categories`,
    });

    const category = await this.categoryRepository.createOne({
      data: {
        name,
        image: Key,
        brandIds: parsedBrandIds,
        createdBy: user._id,
      },
    });

    if (!category) {
      await this.cloudinaryService.deleteAsset({ key: Key });

      throw new BadRequestException('Fail To Create This Category Instance');
    }

    return category.toJSON();
  }

  async update(
    { categoryId, removeBrandIds = [] }: UpdateCategoryParamsDto,
    { name, brandIds = [] }: UpdateCategoryDto,
    user: HydratedUserDocument,
    file?: IFile,
  ): Promise<ICategory> {
    const parsedCategoryId = toObjectId(categoryId as string);
    const parsedBrandIds = brandIds.map((ele) => toObjectId(ele as string));
    const parsedRemoveBrandIds = removeBrandIds.map((ele) =>
      toObjectId(ele as string),
    );

    if (name) {
      const checkDuplicated = await this.categoryRepository.findOne({
        filter: { name, _id: { $ne: parsedCategoryId }, paranoid: false },
      });
      if (checkDuplicated)
        throw new ConflictException('Category already exists');
    }

    if (
      parsedBrandIds.length !==
      (
        await this.brandRepository.find({
          filter: { _id: { $in: parsedBrandIds } },
        })
      ).length
    ) {
      throw new NotFoundException('Missing some or all mentioned brands');
    }

    let newImageKey: string | undefined;

    if (file) {
      const { Key } = await this.cloudinaryService.uploadAsset({
        file,
        path: `Categories`,
      });
      newImageKey = Key;
    }

    const category = await this.categoryRepository.findOneAndUpdate({
      filter: { _id: parsedCategoryId },
      update: [
        {
          $set: {
            updatedBy: user._id,
            ...(name ? { name, slug: generateSlug(name) } : {}),
            ...(file && newImageKey ? { image: newImageKey } : {}),
            brandIds: {
              $setUnion: [
                {
                  $setDifference: ['$brandIds', parsedRemoveBrandIds],
                },
                parsedBrandIds,
              ],
            },
          },
        },
      ],
      options: { new: false },
    });

    if (!category) {
      if (newImageKey) {
        await this.cloudinaryService.deleteAsset({ key: newImageKey });
      }
      throw new BadRequestException('Fail to update');
    }

    if (file && newImageKey && category.image) {
      await this.cloudinaryService.deleteAsset({ key: category.image });
      category.image = newImageKey;
    }

    return category.toJSON();
  }
}
