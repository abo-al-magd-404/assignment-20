import { AuthenticationService } from './authentication.service';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConfirmEmailDto,
  LoginDto,
  ResendConfirmEmailDto,
  SignupDto,
  SignupWithGmailDto,
} from './dto/authentication.dto';
import type { Request, Response } from 'express';
import { IUser } from 'src/common/interfaces';
import { LoginResponse } from './entities/authentication.entity';

@UsePipes(
  new ValidationPipe({
    stopAtFirstError: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly AuthenticationService: AuthenticationService) {}

  @Post('signup')
  async signup(@Body() body: SignupDto): Promise<IUser> {
    return await this.AuthenticationService.signup(body);
  }

  @Patch('confirm-email')
  async confirmEmail(@Body() body: ConfirmEmailDto): Promise<void> {
    await this.AuthenticationService.confirmEmail(body);
  }

  @Patch('resend-confirm-email')
  async resendConfirmEmail(@Body() body: ResendConfirmEmailDto): Promise<void> {
    await this.AuthenticationService.resendConfirmEmail(body);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Req() req: Request,
    @Body() body: LoginDto,
  ): Promise<LoginResponse> {
    return await this.AuthenticationService.login(
      body,
      `${req.protocol}://${req.host}`,
    );
  }

  @Post('signup/gmail')
  async signupWithGmail(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() body: SignupWithGmailDto,
  ): Promise<LoginResponse> {
    const { status, credentials } =
      await this.AuthenticationService.signupWithGmail(
        body.idToken,
        `${req.protocol}://${req.host}`,
      );
    res.status(status);
    return credentials;
  }
}
