import { MiddlewareConsumer, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import {} from 'src/common/middleware';
import { CloudinaryService } from 'src/common/service';

@Module({
  imports: [],
  exports: [],
  controllers: [UserController],
  providers: [UserService, CloudinaryService],
})
export class UserModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply().forRoutes(UserController);
  }
}
