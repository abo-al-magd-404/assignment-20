import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthenticationModule } from './modules/authentication/authentication.module';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CategoryModule } from './modules/category/category.module';
import { OrderModule } from './modules/order/order.module';
import { BrandModule } from './modules/brand/brand.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SharedAuthenticationModule } from './common/modules';
import { CloudinaryService } from './common/service';
import { CartModule } from './modules/cart/cart.module';
import { CacheModule } from '@nestjs/cache-manager';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.production'],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () => console.log('DB CONNECTED ⚡'));
          connection.on('open', () => console.log('DB OPENED ⚡'));
          connection.on('disconnected', () =>
            console.log('DB DISCONNECTED ⚡'),
          );
          connection.on('reconnected', () => console.log('DB RECONNECTED ⚡'));
          connection.on('disconnecting', () =>
            console.log('DB DISCONNECTING ⚡'),
          );

          return connection;
        },
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      graphiql: true,
    }),
    CacheModule.register({
      ttl: 10000,
      isGlobal: true,
    }),
    SharedAuthenticationModule,
    AuthenticationModule,
    UserModule,
    ProductModule,
    CategoryModule,
    BrandModule,
    OrderModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService, CloudinaryService],
})
export class AppModule {}
