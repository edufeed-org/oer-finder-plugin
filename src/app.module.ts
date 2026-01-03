import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OerSource } from './oer/entities/oer-source.entity';
import { OpenEducationalResource } from './oer/entities/open-educational-resource.entity';
import { NostrModule } from './nostr/nostr.module';
// Re-export services from package for convenience
export {
  NostrClientService,
  NostrEventDatabaseService,
  EventDeletionService,
} from '@edufeed-org/oer-nostr';
import { OerModule } from './oer/oer.module';
import appConfig from './config/configuration';
import databaseConfig from './config/database.config';
import nostrConfig from './config/nostr.config';
import { validateEnv } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, nostrConfig],
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
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres' as const,
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        entities: [OerSource, OpenEducationalResource],
        synchronize: configService.get('app.nodeEnv') === 'test',
        logging:
          configService.get('app.nodeEnv') === 'production'
            ? false
            : configService.get<boolean>('database.logging'),
        extra: {
          statement_timeout: 5000, // 5 second query timeout
          max: 20, // Maximum 20 connections in pool
          min: 2, // Minimum 2 connections
          idleTimeoutMillis: 30000, // Release idle connections after 30 seconds
        },
      }),
    }),
    NostrModule,
    OerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
