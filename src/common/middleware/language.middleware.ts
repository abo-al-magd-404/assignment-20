import type { NextFunction, Request, Response } from 'express';

export const defaultLanguage = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  req.headers['accept-language'] ??= 'en';
  next();
};
