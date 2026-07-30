import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandParamsDto } from './dto/update-brand.dto';
import { CloudinaryService } from 'src/common/service';
import { BrandRepository } from 'src/common/repository';
import { HydratedUserDocument } from 'src/model';
import { IBrand, IFile } from 'src/common/interfaces';
import { generateSlug, toObjectId } from 'src/common/utils';

@Injectable()
export class BrandService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly brandRepository: BrandRepository,
  ) {}

  async create(
    { name }: CreateBrandDto,
    user: HydratedUserDocument,
    file: IFile,
  ): Promise<IBrand> {
    const checkDuplicated = await this.brandRepository.findOne({
      filter: { name, paranoid: false },
    });

    if (checkDuplicated) throw new ConflictException('Brand Already Exists');

    const { Key } = await this.cloudinaryService.uploadAsset({
      file,
      path: `Brands`,
    });

    const brand = await this.brandRepository.createOne({
      data: {
        name,
        image: Key,
        createdBy: user._id,
      },
    });

    if (!brand) {
      await this.cloudinaryService.deleteAsset({ key: Key });

      throw new BadRequestException('Fail To Create This Brand Instance');
    }

    return brand.toJSON();
  }

  async update(
    { brandId }: UpdateBrandParamsDto,
    { name }: UpdateBrandDto,
    user: HydratedUserDocument,
    file?: IFile,
  ): Promise<IBrand> {
    const parsedBrandId = toObjectId(brandId as string);

    const brand = await this.brandRepository.findOne({
      filter: { _id: parsedBrandId },
    });

    if (!brand) throw new NotFoundException('fail to find matching brand');

    if (name) {
      const isNameDuplicated = await this.brandRepository.findOne({
        filter: { name, _id: { $ne: parsedBrandId }, paranoid: false },
      });

      if (isNameDuplicated) {
        throw new ConflictException('brand with same name already exists');
      }

      brand.name = name;
      brand.slug = generateSlug(name);
    }

    let oldImageKey: string | undefined;

    if (file) {
      oldImageKey = brand.image;

      const { Key } = await this.cloudinaryService.uploadAsset({
        file,
        path: 'Brands',
      });

      brand.image = Key;
    }

    brand.updatedBy = user._id;

    const updatedBrand = await brand.save();

    if (file && oldImageKey) {
      await this.cloudinaryService.deleteAsset({ key: oldImageKey });
    }

    return updatedBrand.toJSON();
  }
}
