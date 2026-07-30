import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { BrandModel } from 'src/model';
import { BrandRepository } from 'src/common/repository';
import { CloudinaryService } from 'src/common/service';

@Module({
  imports: [BrandModel],
  controllers: [BrandController],
  providers: [BrandService, BrandRepository, CloudinaryService],
})
export class BrandModule {}
