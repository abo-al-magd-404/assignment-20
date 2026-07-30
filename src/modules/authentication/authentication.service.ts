import { ConfigService } from '@nestjs/config';
import { EmailService } from './../../common/service/email.service';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRepository } from 'src/common/repository';
import {
  ConfirmEmailDto,
  LoginDto,
  ResendConfirmEmailDto,
  SignupDto,
} from './dto/authentication.dto';
import { IUser } from 'src/common/interfaces';
import { CacheService, TokenService } from 'src/common/service';
import { EmailEnum, ProviderEnum } from 'src/common/enum';
import { SecurityService } from 'src/common/modules/security/security.service';
import { createRandomOtp } from 'src/common/utils';
import { emailEvent } from 'src/common/event';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { LoginResponse } from './entities/authentication.entity';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly tokenService: TokenService,
    private readonly userRepository: UserRepository,
    private readonly redis: CacheService,
    private readonly emailService: EmailService,
    private readonly securityService: SecurityService,
  ) {}

  async signup({
    email,
    username,
    password,
    phone,
  }: SignupDto): Promise<IUser> {
    const checkUserExist = await this.userRepository.findOne({
      filter: { email },
      projection: 'email',
      options: { lean: true },
    });

    if (checkUserExist) {
      throw new ConflictException('Email Exist');
    }

    const user = await this.userRepository.createOne({
      data: {
        email,
        username,
        password,
        phone,
      },
    });

    if (!user) {
      throw new BadRequestException('Fail');
    }

    await this.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: 'verify Email',
    });

    return user.toJSON();
  }

  async sendEmailOtp({
    email,
    subject,
    title,
  }: {
    email: string;
    subject: EmailEnum;
    title: string;
  }): Promise<void> {
    const isBlockedTTL = await this.redis.ttl(
      this.redis.blockOtpKey({ email, subject }),
    );

    if (isBlockedTTL > 0) {
      throw new BadRequestException(
        `sorry we cannot request new otp while are blocked please try again after >>> ${isBlockedTTL}`,
      );
    }

    const remainingOtpTTL = await this.redis.ttl(
      this.redis.otpKey({ email, subject }),
    );

    if (remainingOtpTTL > 0) {
      throw new BadRequestException(
        `sorry we cannot request new otp while current otp still active please try again after >>> ${remainingOtpTTL}`,
      );
    }

    const maxTrial = await this.redis.get(
      this.redis.maxAttemptOtpKey({ email, subject }),
    );
    if (maxTrial >= 3) {
      await this.redis.set({
        key: this.redis.blockOtpKey({ email, subject }),
        value: 1,
        ttl: 7 * 60,
      });

      throw new BadRequestException(`you have reached the max trial`);
    }

    const code = createRandomOtp();
    await this.redis.set({
      key: this.redis.otpKey({ email, subject }),
      value: await this.securityService.generateHash({ plaintext: `${code}` }),
      ttl: 120,
    });

    emailEvent.emit('sendEmail', async () => {
      await this.emailService.sendEmail({
        to: email,
        subject,
        html: this.emailService.emailTemplate({ code, title }),
      });

      await this.redis.incr(this.redis.maxAttemptOtpKey({ email, subject }));
    });
  }

  async confirmEmail({ email, otp }: ConfirmEmailDto): Promise<void> {
    const hashOtp = await this.redis.get(
      this.redis.otpKey({ email, subject: EmailEnum.CONFIRM_EMAIL }),
    );
    if (!hashOtp) {
      throw new NotFoundException('Expired OTP');
    }

    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!account) {
      throw new NotFoundException('fail to find matching account');
    }

    if (
      !(await this.securityService.compareHash({
        plaintext: otp,
        cipherText: hashOtp,
      }))
    ) {
      throw new ConflictException('Invalid OTP');
    }

    account.confirmEmail = new Date();
    await account.save();

    await this.redis.deleteKey(
      await this.redis.keys(this.redis.otpKey({ email })),
    );
    return;
  }

  async resendConfirmEmail({ email }: ResendConfirmEmailDto): Promise<void> {
    const account = await this.userRepository.findOne({
      filter: {
        email,
        confirmEmail: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!account) {
      throw new NotFoundException('fail to find matching account');
    }

    await this.sendEmailOtp({
      email,
      subject: EmailEnum.CONFIRM_EMAIL,
      title: 'verify email',
    });

    return;
  }

  async login(
    { email, password, FCM }: LoginDto,
    issuer: string,
  ): Promise<LoginResponse> {
    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
      },
    });

    if (!user) {
      throw new NotFoundException('invalid login credentials');
    }

    if (
      !(await this.securityService.compareHash({
        plaintext: password,
        cipherText: user.password,
      }))
    ) {
      throw new NotFoundException('invalid login credentials');
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  private async verifyGoogleAccount(idToken: string): Promise<TokenPayload> {
    const client = new OAuth2Client();

    const ticket = await client.verifyIdToken({
      idToken,
      audience: this.configService.get('CLIENT_IDS'),
    });

    const payload = ticket.getPayload();

    if (!payload?.email_verified) {
      throw new BadRequestException('invalid token payload');
    }

    return payload;
  }

  async loginWithGmail(
    idToken: string,
    issuer: string,
  ): Promise<LoginResponse> {
    const payload = await this.verifyGoogleAccount(idToken);

    const user = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
        provider: ProviderEnum.GOOGLE,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'invalid account provider or not register account',
      );
    }

    return await this.tokenService.createLoginCredentials(user, issuer);
  }

  async signupWithGmail(
    idToken: string,
    issuer: string,
  ): Promise<{ status: number; credentials: LoginResponse }> {
    const payload = await this.verifyGoogleAccount(idToken);

    const checkExist = await this.userRepository.findOne({
      filter: {
        email: payload.email as string,
      },
    });

    console.log({ checkExist });

    if (checkExist) {
      if (checkExist.provider != ProviderEnum.GOOGLE) {
        throw new ConflictException('invalid account provider');
      }
      return {
        status: 200,
        credentials: await this.loginWithGmail(idToken, issuer),
      };
    }

    const account = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        profilePicture: payload.picture,
        confirmEmail: new Date(),
        provider: ProviderEnum.GOOGLE,
      },
    });

    return {
      status: 201,
      credentials: await this.tokenService.createLoginCredentials(
        account,
        issuer,
      ),
    };
  }
}
