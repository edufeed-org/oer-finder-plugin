import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NostrClientService,
  NostrEventDatabaseService,
  EventDeletionService,
  OerStorageService,
  OerExtractionService,
  OER_SOURCE_REPOSITORY,
  OER_REPOSITORY,
  CONFIG_SERVICE,
  NOSTR_EVENT_DATABASE_SERVICE,
  EVENT_DELETION_SERVICE,
  OER_STORAGE_SERVICE,
  OER_EXTRACTION_SERVICE,
} from '@edufeed-org/oer-nostr';
import { OerSource, OpenEducationalResource } from '@edufeed-org/oer-entities';

/**
 * Main application's NostrModule that provides the nostr services from
 * @edufeed-org/oer-nostr with application-specific dependencies.
 *
 * This module manually wires up the package services with application repositories
 * to work around bundling issues with NestJS decorator metadata.
 */
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([OerSource, OpenEducationalResource]),
  ],
  providers: [
    // Provide ConfigService via the package's injection token
    {
      provide: CONFIG_SERVICE,
      useExisting: ConfigService,
    },
    // Map TypeORM repositories to the package's injection tokens
    {
      provide: OER_SOURCE_REPOSITORY,
      useFactory: (repo: Repository<OerSource>) => repo,
      inject: [getRepositoryToken(OerSource)],
    },
    {
      provide: OER_REPOSITORY,
      useFactory: (repo: Repository<OpenEducationalResource>) => repo,
      inject: [getRepositoryToken(OpenEducationalResource)],
    },
    // Register the nostr services from the package with their injection tokens
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
    OerStorageService,
    {
      provide: OER_STORAGE_SERVICE,
      useExisting: OerStorageService,
    },
    OerExtractionService,
    {
      provide: OER_EXTRACTION_SERVICE,
      useExisting: OerExtractionService,
    },
    NostrClientService,
  ],
  exports: [
    NostrClientService,
    NostrEventDatabaseService,
    EventDeletionService,
    OerExtractionService,
  ],
})
export class NostrModule {}
