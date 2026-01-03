import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  NostrClientService,
  CONFIG_SERVICE,
} from './services/nostr-client.service';
import {
  NostrEventDatabaseService,
  OER_SOURCE_REPOSITORY,
  NOSTR_EVENT_DATABASE_SERVICE,
} from './services/nostr-event-database.service';
import {
  EventDeletionService,
  OER_REPOSITORY,
  EVENT_DELETION_SERVICE,
} from './services/event-deletion.service';
import {
  OerExtractionService,
  OER_EXTRACTION_SERVICE,
} from './services/oer-extraction.service';

/**
 * Options for configuring the NostrModule
 */
export interface NostrModuleOptions {
  /**
   * Provider for the OerSource repository
   */
  oerSourceRepository: Provider;

  /**
   * Provider for the OpenEducationalResource repository
   */
  oerRepository: Provider;
}

/**
 * NestJS module for Nostr protocol integration.
 * Use the register() method to configure with your application's repositories and services.
 *
 * @example
 * ```typescript
 * import { NostrModule } from '@edufeed-org/oer-nostr';
 *
 * @Module({
 *   imports: [
 *     NostrModule.register({
 *       oerSourceRepository: {
 *         provide: 'OER_SOURCE_REPOSITORY',
 *         useFactory: (dataSource) => dataSource.getRepository(OerSource),
 *         inject: [DataSource],
 *       },
 *       oerRepository: {
 *         provide: 'OER_REPOSITORY',
 *         useFactory: (dataSource) => dataSource.getRepository(OpenEducationalResource),
 *         inject: [DataSource],
 *       },
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class NostrModule {
  /**
   * Register the NostrModule with custom providers for repositories and services.
   */
  static register(options: NostrModuleOptions): DynamicModule {
    const providers: Provider[] = [
      // Provide ConfigService via injection token for proper DI in bundled package
      {
        provide: CONFIG_SERVICE,
        useExisting: ConfigService,
      },
      // Register services with their injection tokens
      NostrEventDatabaseService,
      {
        provide: NOSTR_EVENT_DATABASE_SERVICE,
        useExisting: NostrEventDatabaseService,
      },
      EventDeletionService,
      {
        provide: EVENT_DELETION_SERVICE,
        useExisting: EventDeletionService,
      },
      OerExtractionService,
      {
        provide: OER_EXTRACTION_SERVICE,
        useExisting: OerExtractionService,
      },
      NostrClientService,
      options.oerSourceRepository,
      options.oerRepository,
    ];

    return {
      module: NostrModule,
      imports: [ConfigModule],
      providers,
      exports: [
        NostrClientService,
        NostrEventDatabaseService,
        EventDeletionService,
        OerExtractionService,
        NOSTR_EVENT_DATABASE_SERVICE,
        EVENT_DELETION_SERVICE,
        OER_EXTRACTION_SERVICE,
        OER_SOURCE_REPOSITORY,
        OER_REPOSITORY,
      ],
    };
  }
}
