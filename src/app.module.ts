import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OerModule } from './oer/oer.module';
import appConfig from './config/configuration';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('app.throttle.ttl', 60000),
            limit: configService.get<number>('app.throttle.limit', 10),
            blockDuration: configService.get<number>(
              'app.throttle.blockDuration',
              60000,
            ),
          },
        ],
        getTracker: (req) => req.ip, // Track rate limits per IP address
      }),
    }),
    OerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
