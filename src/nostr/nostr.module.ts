import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OerSource } from '../oer/entities/oer-source.entity';
import { OpenEducationalResource } from '../oer/entities/open-educational-resource.entity';
import { NostrClientService } from './services/nostr-client.service';
import { NostrEventDatabaseService } from './services/nostr-event-database.service';
import { EventDeletionService } from './services/event-deletion.service';
import { OerModule } from '../oer/oer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([OerSource, OpenEducationalResource]),
    forwardRef(() => OerModule),
  ],
  providers: [
    NostrClientService,
    NostrEventDatabaseService,
    EventDeletionService,
  ],
  exports: [
    NostrClientService,
    NostrEventDatabaseService,
    EventDeletionService,
    TypeOrmModule,
  ],
})
export class NostrModule {}
