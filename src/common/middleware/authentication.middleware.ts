import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { TokenService } from '../service';
import { TokenTypeEnum } from '../enum';

export const preAuthMiddleware = (
  req: Request & { tokenType: TokenTypeEnum },
  res: Response,
  next: NextFunction,
) => {
  if (!req.headers['authorization']) {
    return res.status(401).json({ message: 'missing Authorization' });
  }
  next();
};

@Injectable()
export class AuthenticationMiddleware implements NestMiddleware {
  constructor(private readonly tokenService: TokenService) {}

  async use(
    req: Request & { tokenType: TokenTypeEnum },
    res: Response,
    next: NextFunction,
  ) {
    const [key, token] = req.headers['authorization']?.split(' ') as string[];

    console.log({ key, token, tokenType: req.tokenType });

    const { user, decoded } = await this.tokenService.decodeToken({
      token,
      tokenType: req.tokenType,
    });

    console.log({ user, decoded });

    next();
  }
}
