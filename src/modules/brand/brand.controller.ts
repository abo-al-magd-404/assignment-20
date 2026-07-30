import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
} from '@nestjs/common';
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto, UpdateBrandParamsDto } from './dto/update-brand.dto';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils';
import type { HydratedUserDocument } from 'src/model';
import type { IBrand, IFile } from 'src/common/interfaces';

@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Post()
  @Auth([RoleEnum.ADMIN])
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  async create(
    @Body() createBrandDto: CreateBrandDto,
    @User() user: HydratedUserDocument,
    @UploadedFile(ParseFilePipe) file: IFile,
  ): Promise<IBrand> {
    return await this.brandService.create(createBrandDto, user, file);
  }

  @Patch(':brandId')
  @Auth([RoleEnum.ADMIN])
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  async update(
    @Param() params: UpdateBrandParamsDto,
    @Body() updateBrandDto: UpdateBrandDto,
    @User() user: HydratedUserDocument,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file?: IFile,
  ): Promise<IBrand> {
    return await this.brandService.update(params, updateBrandDto, user, file);
  }
}
