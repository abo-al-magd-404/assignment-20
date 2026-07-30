import {
  Controller,
  Post,
  Body,
  UseInterceptors,
  UploadedFiles,
  Patch,
  Param,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils';
import type { HydratedUserDocument } from 'src/model';
import type { IFile } from 'src/common/interfaces';
import {
  UpdateProductDto,
  UpdateProductParamsDto,
} from './dto/update-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Auth([RoleEnum.ADMIN])
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 3 },
      ],
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  async create(
    @Body() createProductDto: CreateProductDto,
    @User() user: HydratedUserDocument,
    @UploadedFiles() files: { image: IFile[]; gallery?: IFile[] },
  ) {
    return await this.productService.create(createProductDto, user, files);
  }

  @Patch(':productId')
  @Auth([RoleEnum.ADMIN])
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'image', maxCount: 1 },
        { name: 'gallery', maxCount: 3 },
      ],
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  async update(
    @Param() params: UpdateProductParamsDto,
    @Body()
    updateProductDto: UpdateProductDto,
    @User() user: HydratedUserDocument,
    @UploadedFiles() files?: { image?: IFile[]; gallery?: IFile[] },
  ) {
    return await this.productService.update(
      params,
      updateProductDto,
      user,
      files,
    );
  }
}
