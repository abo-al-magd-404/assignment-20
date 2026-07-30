import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repository';
import { CacheService } from './cache.service';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload, SignOptions } from 'jsonwebtoken';
import { RoleEnum, TokenTypeEnum } from '../enum';
import { HydratedDocument, Types } from 'mongoose';
import { IUser } from '../interfaces';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class TokenService {
  private ACCESS_TOKEN_EXPIRES_IN: number;
  private REFRESH_TOKEN_EXPIRES_IN: number;
  private SYSTEM_ACCESS_TOKEN_SIGNATURE: string;
  private SYSTEM_REFRESH_TOKEN_SIGNATURE: string;
  private USER_ACCESS_TOKEN_SIGNATURE: string;
  private USER_REFRESH_TOKEN_SIGNATURE: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly redis: CacheService,
  ) {
    this.ACCESS_TOKEN_EXPIRES_IN = Number(
      this.configService.get<string>('ACCESS_TOKEN_EXPIRES_IN'),
    );
    this.REFRESH_TOKEN_EXPIRES_IN = Number(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
    );
    this.SYSTEM_ACCESS_TOKEN_SIGNATURE = this.configService.get<string>(
      'SYSTEM_ACCESS_TOKEN_SIGNATURE',
    ) as string;
    this.SYSTEM_REFRESH_TOKEN_SIGNATURE = this.configService.get<string>(
      'SYSTEM_REFRESH_TOKEN_SIGNATURE',
    ) as string;
    this.USER_ACCESS_TOKEN_SIGNATURE = this.configService.get<string>(
      'USER_ACCESS_TOKEN_SIGNATURE',
    ) as string;
    this.USER_REFRESH_TOKEN_SIGNATURE = this.configService.get<string>(
      'USER_REFRESH_TOKEN_SIGNATURE',
    ) as string;
  }

  async sign({
    payload,
    secret = this.USER_ACCESS_TOKEN_SIGNATURE,
    options,
  }: {
    payload: object;
    secret?: string;
    options?: SignOptions;
  }): Promise<string> {
    return await this.jwtService.signAsync(payload, { secret, ...options });
  }

  verify({
    token,
    secret = this.USER_ACCESS_TOKEN_SIGNATURE,
  }: {
    token: string;
    secret?: string;
  }): Promise<JwtPayload> {
    return this.jwtService.verifyAsync(token, { secret });
  }

  detectSignatureLevel(role: RoleEnum): {
    accessSignature: string;
    refreshSignature: string;
  } {
    let signatures: {
      accessSignature: string;
      refreshSignature: string;
    };
    switch (role) {
      case RoleEnum.ADMIN:
        signatures = {
          accessSignature: this.SYSTEM_ACCESS_TOKEN_SIGNATURE,
          refreshSignature: this.SYSTEM_REFRESH_TOKEN_SIGNATURE,
        };
        break;
      default:
        signatures = {
          accessSignature: this.USER_ACCESS_TOKEN_SIGNATURE,
          refreshSignature: this.USER_REFRESH_TOKEN_SIGNATURE,
        };
        break;
    }
    return signatures;
  }

  getSignature(
    tokenType = TokenTypeEnum.ACCESS,
    signatureLevel: RoleEnum,
  ): string {
    const signatures = this.detectSignatureLevel(signatureLevel);
    let signature: string;
    switch (tokenType) {
      case TokenTypeEnum.REFRESH:
        signature = signatures.refreshSignature;
        break;
      default:
        signature = signatures.accessSignature;
        break;
    }
    return signature;
  }

  async decodeToken({
    token,
    tokenType = TokenTypeEnum.ACCESS,
  }: {
    token: string;
    tokenType?: TokenTypeEnum;
  }): Promise<{
    user: HydratedDocument<IUser>;
    decoded: JwtPayload;
  }> {
    const decoded = this.jwtService.decode(token);

    if (!decoded || !Array.isArray(decoded.aud) || !decoded.aud.length) {
      throw new BadRequestException('missing token audience');
    }

    const [tokenApproach, signatureLevel] = decoded.aud;

    if (tokenApproach == undefined || signatureLevel == undefined) {
      throw new BadRequestException('Missing Token Audience');
    }
    if (tokenType != (tokenApproach as unknown as TokenTypeEnum)) {
      throw new BadRequestException(
        `invalid token approach, only ${tokenType} allowed for this endpoint`,
      );
    }
    if (
      decoded.jti &&
      (await this.redis.get(
        this.redis.revokeTokenKey({
          userId: decoded.sub as string,
          jti: decoded.jti,
        }),
      ))
    ) {
      throw new UnauthorizedException('invalid login session');
    }

    const secret = this.getSignature(
      tokenApproach as TokenTypeEnum,
      signatureLevel as RoleEnum,
    );

    const verifiedData = await this.verify({ token, secret });
    if (!verifiedData?.sub) {
      throw new BadRequestException('invalid token payload');
    }

    const user = await this.userRepository.findOne({
      filter: {
        _id: verifiedData.sub,
      },
    });
    if (!user) {
      throw new NotFoundException('Not Register Account');
    }

    if (
      user.changeCredentialsTime &&
      user.changeCredentialsTime?.getTime() >=
        ((decoded.iat as number) || 0) * 1000
    ) {
      throw new UnauthorizedException('invalid login session');
    }

    return { user, decoded };
  }

  async createLoginCredentials(
    user: HydratedDocument<IUser>,
    issuer: string,
  ): Promise<{ access_token: string; refresh_token: string }> {
    const { accessSignature, refreshSignature } = this.detectSignatureLevel(
      user.role,
    );

    const userId = user._id.toString();

    const access_token = await this.sign({
      payload: { sub: userId },
      secret: accessSignature,
      options: {
        issuer,
        audience: [
          TokenTypeEnum.ACCESS as unknown as string,
          user.role as unknown as string,
        ],
        expiresIn: this.ACCESS_TOKEN_EXPIRES_IN,
        jwtid: randomUUID(),
      },
    });

    const refresh_token = await this.sign({
      payload: { sub: userId },
      secret: refreshSignature,
      options: {
        issuer,
        audience: [
          TokenTypeEnum.REFRESH as unknown as string,
          user.role as unknown as string,
        ],
        expiresIn: this.REFRESH_TOKEN_EXPIRES_IN,
        jwtid: randomUUID(),
      },
    });
    return { access_token, refresh_token };
  }

  async createRevokeToken({
    userId,
    jti,
    ttl,
  }: {
    userId: Types.ObjectId | string;
    jti: string;
    ttl: number;
  }) {
    await this.redis.set({
      key: this.redis.revokeTokenKey({ userId, jti }),
      value: jti,
      ttl,
    });
    return;
  }
}
