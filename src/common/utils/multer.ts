import { IFile } from './../interfaces';
import { diskStorage, memoryStorage } from 'multer';
import type { Request } from 'express';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { randomUUID } from 'crypto';
import { BadRequestException } from '@nestjs/common';
import { storageApproachEnum } from '../enum';
import { tmpdir } from 'os';

export const fileFieldValidation = {
  image: ['image/jpeg', 'image/jpg', 'image/png'],
  video: ['video/mp4'],
};

export const cloudMulter = ({
  storageApproach = storageApproachEnum.MEMORY,
  validation = [],
  folder = 'public',
  fileSize = 2,
}: {
  storageApproach?: storageApproachEnum;
  validation?: string[];
  folder?: string;
  fileSize?: number;
}) => {
  return {
    storage:
      storageApproach === storageApproachEnum.MEMORY
        ? memoryStorage()
        : diskStorage({
            destination: function (
              req: Request,
              file: Express.Multer.File,
              callback: (error: Error | null, destination: string) => void,
            ) {
              callback(null, tmpdir());
            },
            filename: function (
              req: Request,
              file: Express.Multer.File,
              callback: (error: Error | null, destination: string) => void,
            ) {
              callback(null, `${randomUUID()}__${file.originalname}`);
            },
          }),
    fileFilter(req: Request, file: IFile, callback: Function) {
      if (!validation.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid File Format'));
      }
      return callback(null, true);
    },

    limits: { fileSize: fileSize * 1024 * 1024 },
  };
};

export const localMulter = ({
  validation = [],
  folder = 'public',
  fileSize = 2,
}: {
  validation?: string[];
  folder?: string;
  fileSize?: number;
}) => {
  return {
    storage: diskStorage({
      destination(req: Request, file: IFile, callback: Function) {
        const fullPath = resolve(`./uploads/${folder}`);
        if (!existsSync(fullPath)) {
          mkdirSync(fullPath, { recursive: true });
        }
        return callback(null, fullPath);
      },

      filename(req: Request, file: IFile, callback: Function) {
        const uniqueFileName = randomUUID() + '_' + file.originalname;
        file.finalPath = `uploads/${folder}/${uniqueFileName}`;
        return callback(null, uniqueFileName);
      },
    }),
    fileFilter(req: Request, file: IFile, callback: Function) {
      if (validation.length > 0 && !validation.includes(file.mimetype)) {
        return callback(new BadRequestException('Invalid File Format'), false);
      }
      return callback(null, true);
    },

    limits: { fileSize: fileSize * 1024 * 1024 },
  };
};
