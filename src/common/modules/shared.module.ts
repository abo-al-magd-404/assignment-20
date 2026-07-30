import { Global, Module } from '@nestjs/common';
import { UserModel } from 'src/model';
import { UserRepository } from '../repository';
import { CacheService, TokenService } from '../service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Global()
@Module({
  imports: [UserModel],
  exports: [
    'REDIS_CLIENT',
    UserRepository,
    CacheService,
    JwtService,
    TokenService,
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: configService.get<string>('REDIS_URL'),
        });

        client.on('error', (err) => console.log('Redis Client Error', err));

        await client.connect();

        console.log('Redis Connected ⚡');

        return client;
      },
      inject: [ConfigService],
    },
    UserRepository,
    CacheService,
    JwtService,
    TokenService,
  ],
})
export class SharedAuthenticationModule {}
