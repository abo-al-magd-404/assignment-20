import { UserService } from './user.service';
import {
  Controller,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Auth, User } from 'src/common/decorator';
import { RoleEnum } from 'src/common/enum';
import type { HydratedUserDocument } from 'src/model';
import type { Request } from 'express';
import type { IFile, IUser } from 'src/common/interfaces';
import { FileInterceptor } from '@nestjs/platform-express';
import { fileFieldValidation, cloudMulter } from 'src/common/utils';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Auth([RoleEnum.USER])
  profile(@Req() req: Request, @User() user: HydratedUserDocument): IUser {
    return user;
  }

  @Patch('profile-image')
  @Auth([RoleEnum.USER])
  @UseInterceptors(
    FileInterceptor(
      'attachment',
      cloudMulter({ validation: fileFieldValidation.image }),
    ),
  )
  async profileImage(
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
        validators: [new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 })],
      }),
    )
    file: IFile,
    @Req() req: Request,
    @User() user: HydratedUserDocument,
  ): Promise<IUser> {
    return await this.userService.profileImage(file, user);
  }
}
