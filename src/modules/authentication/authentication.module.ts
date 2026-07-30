import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { EmailService } from 'src/common/service';
import { SecurityService } from 'src/common/modules/security/security.service';
import { defaultLanguage } from 'src/common/middleware';

@Module({
  imports: [],
  exports: [],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, EmailService, SecurityService],
})
export class AuthenticationModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(defaultLanguage)
      .forRoutes({ path: 'auth/*', method: RequestMethod.ALL });
  }
}
