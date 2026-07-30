import {
  Body,
  Controller,
  Param,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { cloudMulter, fileFieldValidation } from 'src/common/utils';
import { CreateCategoryDto } from './dto/create-category.dto';
import type { HydratedUserDocument } from 'src/model';
import { ICategory, type IFile } from 'src/common/interfaces';
import {
  UpdateCategoryDto,
  UpdateCategoryParamsDto,
} from './dto/update-category.dto';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @Auth([RoleEnum.ADMIN])
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
    @User() user: HydratedUserDocument,
    @UploadedFile(ParseFilePipe) file: IFile,
  ): Promise<ICategory> {
    return await this.categoryService.create(createCategoryDto, user, file);
  }

  @Patch(':categoryId')
  @Auth([RoleEnum.ADMIN])
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  async update(
    @Param() params: UpdateCategoryParamsDto,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @User() user: HydratedUserDocument,
    @UploadedFile(new ParseFilePipe({ fileIsRequired: false })) file?: IFile,
  ): Promise<ICategory> {
    return await this.categoryService.update(
      params,
      updateCategoryDto,
      user,
      file,
    );
  }
}
