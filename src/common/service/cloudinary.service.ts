import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import streamifier from 'streamifier';
import axios from 'axios';

export enum ObjectCannedACL {
  PRIVATE = 'private',
  PUBLIC_READ = 'public-read',
}

export enum StorageApproachEnum {
  MEMORY = 'memory',
  DISK = 'disk',
}

export enum UploadApproachEnum {
  SMALL = 'small',
  LARGE = 'large',
}

export interface UploadOptions {
  storageApproach?: StorageApproachEnum;
  path?: string;
  file: Express.Multer.File;
  acl?: ObjectCannedACL;
}

export interface UploadMultipleOptions {
  uploadApproach?: UploadApproachEnum;
  storageApproach?: StorageApproachEnum;
  path?: string;
  files: Express.Multer.File[];
  acl?: ObjectCannedACL;
}

@Injectable()
export class CloudinaryService {
  private static readonly IMAGE_EXTENSIONS = new Set([
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'bmp',
    'tiff',
    'svg',
    'avif',
    'heic',
  ]);

  private static readonly VIDEO_EXTENSIONS = new Set([
    'mp4',
    'mov',
    'avi',
    'mkv',
    'webm',
    'flv',
    'wmv',
    'm4v',
  ]);

  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly appName: string;
  private readonly expiresIn: number;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>(
      'CLOUDINARY_CLOUD_NAME',
      '',
    );
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.configService.get<string>(
      'CLOUDINARY_API_SECRET',
      '',
    );
    this.appName = this.configService.get<string>('APP_NAME', 'app');
    this.expiresIn = Number(
      this.configService.get<number>('CLOUDINARY_EXPIRES_IN', 3600),
    );

    cloudinary.config({
      cloud_name: this.cloudName,
      api_key: this.apiKey,
      api_secret: this.apiSecret,
    });
  }

  private mapStorageError(status: number | undefined, key: string): Error {
    switch (status) {
      case 400:
        return new BadRequestException(
          `Invalid asset key or parameters: ${key}`,
        );
      case 401:
      case 403:
        return new ForbiddenException(`Access denied for asset: ${key}`);
      case 404:
        return new NotFoundException(
          `The specified key does not exist: ${key}`,
        );
      default:
        return new InternalServerErrorException(
          `Storage operation failed for: ${key}`,
        );
    }
  }

  private getStorageMetadata(path: string, originalName: string) {
    const lastDotIndex = originalName.lastIndexOf('.');
    const nameWithoutExt =
      lastDotIndex > 0 ? originalName.slice(0, lastDotIndex) : originalName;
    const extension =
      lastDotIndex > 0 ? originalName.slice(lastDotIndex + 1) : '';
    const folder = `${this.appName}/${path}`.replace(/\/{2,}/g, '/');
    const publicId = `${randomUUID()}__${nameWithoutExt}`;
    return { folder, publicId, extension };
  }

  private getAccessMode(acl: ObjectCannedACL): 'authenticated' | 'public' {
    return acl === ObjectCannedACL.PRIVATE ? 'authenticated' : 'public';
  }

  private resolveResourceType(format?: string): 'image' | 'video' | 'raw' {
    const ext = (format ?? '').toLowerCase();
    if (CloudinaryService.IMAGE_EXTENSIONS.has(ext)) return 'image';
    if (CloudinaryService.VIDEO_EXTENSIONS.has(ext)) return 'video';
    return 'raw';
  }

  private async resolveDeliveryVariant({
    publicId,
    preferredResourceType,
  }: {
    publicId: string;
    preferredResourceType: 'image' | 'video' | 'raw';
  }): Promise<{
    resource_type: 'image' | 'video' | 'raw';
    type: 'authenticated' | 'upload';
  }> {
    const resourceTypes: Array<'image' | 'video' | 'raw'> = [
      preferredResourceType,
      ...(['image', 'video', 'raw'] as const).filter(
        (v) => v !== preferredResourceType,
      ),
    ];
    const deliveryTypes: Array<'authenticated' | 'upload'> = [
      'authenticated',
      'upload',
    ];

    for (const resource_type of resourceTypes) {
      for (const type of deliveryTypes) {
        try {
          await cloudinary.api.resource(publicId, { resource_type, type });
          return { resource_type, type };
        } catch (error: any) {
          if (error?.http_code === 404) continue;
        }
      }
    }

    throw this.mapStorageError(404, publicId);
  }

  // ===== UPLOAD SINGLE ASSET =====
  async uploadAsset({
    storageApproach = StorageApproachEnum.MEMORY,
    path = 'general',
    file,
    acl = ObjectCannedACL.PRIVATE,
  }: UploadOptions): Promise<{ Key: string }> {
    const { folder, publicId } = this.getStorageMetadata(
      path,
      file.originalname,
    );

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            public_id: publicId,
            resource_type: 'auto',
            access_mode: this.getAccessMode(acl),
          },
          (error, res) => {
            if (error || !res) return reject(error);
            resolve(res);
          },
        );

        if (storageApproach === StorageApproachEnum.MEMORY) {
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        } else {
          createReadStream(file.path).pipe(uploadStream);
        }
      });

      return { Key: `${result.public_id}.${result.format}` };
    } catch {
      throw new BadRequestException('Failed to upload asset');
    }
  }

  // ===== UPLOAD LARGE ASSET =====
  async uploadLargeAsset({
    storageApproach = StorageApproachEnum.DISK,
    path = 'general',
    file,
    acl = ObjectCannedACL.PRIVATE,
  }: UploadOptions): Promise<{ Key: string }> {
    const { folder, publicId } = this.getStorageMetadata(
      path,
      file.originalname,
    );

    const options = {
      folder,
      public_id: publicId,
      resource_type: 'auto' as const,
      chunk_size: 6000000,
      access_mode: this.getAccessMode(acl),
    };

    try {
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        if (storageApproach === StorageApproachEnum.MEMORY) {
          const uploadStream = cloudinary.uploader.upload_chunked_stream(
            options,
            (error, res) => {
              if (error || !res) return reject(error);
              resolve(res);
            },
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        } else {
          cloudinary.uploader.upload_large(file.path, options, (error, res) => {
            if (error || !res) return reject(error);
            resolve(res);
          });
        }
      });

      return { Key: `${result.public_id}.${result.format}` };
    } catch {
      throw new BadRequestException('Failed to upload large asset');
    }
  }

  // ===== UPLOAD MULTIPLE ASSETS =====
  async uploadAssets({
    uploadApproach = UploadApproachEnum.SMALL,
    storageApproach = StorageApproachEnum.MEMORY,
    path = 'general',
    files,
    acl = ObjectCannedACL.PRIVATE,
  }: UploadMultipleOptions): Promise<string[]> {
    const uploadTasks = files.map((file) => {
      const params: UploadOptions = { storageApproach, path, file, acl };
      return uploadApproach === UploadApproachEnum.LARGE
        ? this.uploadLargeAsset(params).then((res) => res.Key)
        : this.uploadAsset(params).then((res) => res.Key);
    });

    return Promise.all(uploadTasks);
  }

  // ===== CREATE PRESIGNED UPLOAD PARAMS (Front-end Direct Upload) =====
  createPresignedUploadLink({
    path = 'general',
    originalname,
  }: {
    path?: string;
    originalname: string;
  }) {
    const { folder, publicId, extension } = this.getStorageMetadata(
      path,
      originalname,
    );
    const timestamp = Math.round(Date.now() / 1000);

    const paramsToSign = {
      folder,
      public_id: publicId,
      timestamp,
      type: 'authenticated',
    };

    const signature = cloudinary.utils.api_sign_request(
      paramsToSign,
      this.apiSecret,
    );

    return {
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`,
      params: {
        api_key: this.apiKey,
        timestamp,
        type: 'authenticated',
        signature,
        folder,
        public_id: publicId,
      },
      key: `${folder}/${publicId}.${extension}`,
    };
  }

  // ===== CREATE PRESIGNED FETCH LINK =====
  async createPresignedFetchLink({
    key,
    expiresIn = this.expiresIn,
    download,
    fileName,
  }: {
    key: string;
    expiresIn?: number;
    fileName?: string;
    download?: boolean;
  }): Promise<string> {
    const lastDotIndex = key.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0 && lastDotIndex < key.length - 1;
    const publicId = hasExtension ? key.slice(0, lastDotIndex) : key;
    const format = hasExtension ? key.slice(lastDotIndex + 1) : undefined;
    const resourceType = this.resolveResourceType(format);

    const expiresAt = Math.round(Date.now() / 1000) + expiresIn;
    const deliveryVariant = await this.resolveDeliveryVariant({
      publicId,
      preferredResourceType: resourceType,
    });

    const finalFileName = fileName || key.split('/').pop();

    return cloudinary.url(publicId, {
      sign_url: true,
      secure: true,
      type: deliveryVariant.type,
      resource_type: deliveryVariant.resource_type,
      ...(format ? { format } : {}),
      expires_at: expiresAt,
      ...(download
        ? {
            flags: 'attachment',
            attachment_filename: finalFileName,
          }
        : {}),
    });
  }

  // ===== GET ASSET STREAM =====
  async getAsset({ key }: { key: string }) {
    const lastDotIndex = key.lastIndexOf('.');
    const hasExtension = lastDotIndex > 0 && lastDotIndex < key.length - 1;
    const publicId = hasExtension ? key.slice(0, lastDotIndex) : key;
    const format = hasExtension ? key.slice(lastDotIndex + 1) : undefined;

    if (!format) {
      throw new BadRequestException(`Missing format in key: ${key}`);
    }

    const expires_at = Math.floor(Date.now() / 1000) + 60;
    const resourceTypes: Array<'image' | 'raw' | 'video'> = [
      'image',
      'raw',
      'video',
    ];
    const deliveryTypes: Array<'authenticated' | 'upload'> = [
      'authenticated',
      'upload',
    ];

    let lastStatus: number | undefined = 404;

    for (const resource_type of resourceTypes) {
      for (const type of deliveryTypes) {
        const signedDownloadUrl = cloudinary.utils.private_download_url(
          publicId,
          format,
          { resource_type, type, expires_at },
        );

        try {
          const response = await axios.get<NodeJS.ReadableStream>(
            signedDownloadUrl,
            {
              responseType: 'stream',
            },
          );
          return {
            body: response.data,
            contentType: response.headers['content-type'] as string | undefined,
          };
        } catch (error: any) {
          const status = error?.response?.status;
          if (status && status !== 404) {
            throw this.mapStorageError(status, key);
          }
          lastStatus = status ?? lastStatus;
        }
      }
    }

    throw this.mapStorageError(lastStatus, key);
  }

  // ===== DELETE ASSET =====
  async deleteAsset({ key }: { key: string }): Promise<{ result: string }> {
    if (!key) return { result: 'not_found' };

    const lastDotIndex = key.lastIndexOf('.');
    const withoutExtension =
      lastDotIndex > 0 ? key.slice(0, lastDotIndex) : key;
    const extension =
      lastDotIndex > 0 ? key.slice(lastDotIndex + 1).toLowerCase() : '';
    const resource_type = this.resolveResourceType(extension);

    const deliveryTypes: ('authenticated' | 'upload')[] = [
      'authenticated',
      'upload',
    ];

    for (const dType of deliveryTypes) {
      try {
        const result = await cloudinary.uploader.destroy(withoutExtension, {
          resource_type,
          type: dType,
          invalidate: true,
        });

        if (result.result === 'ok') {
          return { result: 'ok' };
        }
      } catch {
        continue;
      }
    }

    return { result: 'not_found' };
  }

  // ===== DELETE MULTIPLE ASSETS =====
  async deleteAssets({ keys }: { keys: { key: string }[] }) {
    if (!keys || keys.length === 0) {
      return { message: 'No keys provided for deletion', deletedCount: 0 };
    }

    const deletePromises = keys.map((k) => this.deleteAsset({ key: k.key }));
    const results = await Promise.all(deletePromises);

    return {
      message: 'Bulk delete operation completed',
      deletedCount: results.filter((r) => r.result === 'ok').length,
      details: results.map((res, index) => ({
        key: keys[index].key,
        status: res.result,
      })),
    };
  }

  // ===== LIST FOLDER DIRECTORY =====
  async listFolderDir({ prefix }: { prefix: string }) {
    const fullPrefix = `${this.appName}/${prefix}`;

    try {
      const [result, authResult] = await Promise.all([
        cloudinary.api.resources({
          type: 'upload',
          prefix: fullPrefix,
          resource_type: 'image',
          max_results: 500,
        }),
        cloudinary.api.resources({
          type: 'authenticated',
          prefix: fullPrefix,
          resource_type: 'image',
          max_results: 500,
        }),
      ]);

      return {
        contents: [...result.resources, ...authResult.resources].map(
          (asset) => ({
            key: `${asset.public_id}.${asset.format}`,
            size: asset.bytes,
            lastModified: asset.created_at,
            url: asset.secure_url,
          }),
        ),
        prefix: fullPrefix,
      };
    } catch (error: any) {
      throw this.mapStorageError(error.http_code || 500, fullPrefix);
    }
  }

  // ===== DELETE FOLDER BY PREFIX =====
  async deleteFolderByPrefix({ prefix }: { prefix: string }) {
    const fullPrefix = `${this.appName}/${prefix}`;

    try {
      const resourceTypes: Array<'image' | 'video' | 'raw'> = [
        'image',
        'video',
        'raw',
      ];

      const deletePromises = resourceTypes.map((type) =>
        cloudinary.api.delete_resources_by_prefix(fullPrefix, {
          resource_type: type,
          invalidate: true,
        }),
      );

      const results = await Promise.all(deletePromises);

      try {
        await cloudinary.api.delete_folder(fullPrefix);
      } catch {}

      return { message: 'Folder deleted', results };
    } catch (error: any) {
      throw this.mapStorageError(error.http_code || 500, fullPrefix);
    }
  }
}
