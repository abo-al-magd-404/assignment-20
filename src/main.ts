import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './config';
import { ValidationPipe } from '@nestjs/common';
import {
  LanguageInterceptor,
  TransformInterceptor,
  WatchInterceptor,
} from './common/interceptor';
import * as express from 'express';
import { resolve } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  app.use('/upload', express.static(resolve(`./uploads`)));

  app.useGlobalInterceptors(
    new WatchInterceptor(),
    new LanguageInterceptor(),
    new TransformInterceptor(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      stopAtFirstError: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(PORT, () => {
    console.log(`server is running on port >>> ${PORT} ⚡`);
  });
}
bootstrap();
