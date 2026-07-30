import { Request } from 'express';
import { JwtPayload } from 'jsonwebtoken';
import { HydratedUserDocument } from 'src/model';

export interface IAuthReq extends Request {
  credentials: { user: HydratedUserDocument; decoded: JwtPayload };
}

export type CTXType = 'http' | 'ws' | 'rpc' | 'graphql';
