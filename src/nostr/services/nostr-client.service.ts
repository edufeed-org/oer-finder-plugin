import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Event } from 'nostr-tools/core';
import { NostrEvent } from '../entities/nostr-event.entity';
import { OerExtractionService } from '../../oer/services/oer-extraction.service';
import { RelayConfigParser } from '../utils/relay-config.parser';
import { EventValidator } from '../utils/event-validator';
import { DatabaseErrorClassifier } from '../utils/database-error.classifier';
import { RelayConnectionManager } from '../utils/relay-connection.manager';
import type { RelayConnection } from '../types/relay-connection.types';
import { NostrEventDatabaseService } from './nostr-event-database.service';
import { EventDeletionService } from './event-deletion.service';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
  EVENT_DELETE_KIND,
} from '../constants/event-kinds.constants';

@Injectable()
export class NostrClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NostrClientService.name);
  private readonly connections: Map<string, RelayConnection> = new Map();
  private readonly relayUrls: readonly string[];
  private readonly connectionManager: RelayConnectionManager;
  private isShuttingDown = false;
  private hasReceivedEose = false;

  constructor(
    private readonly databaseService: NostrEventDatabaseService,
    private readonly oerExtractionService: OerExtractionService,
    private readonly eventDeletionService: EventDeletionService,
    private readonly configService: ConfigService,
  ) {
    const relayUrls = this.configService.get<string>('nostr.relayUrls', '');
    const relayUrl = this.configService.get<string>(
      'nostr.relayUrl',
      'ws://localhost:10547',
    );
    const reconnectDelayMs = this.configService.get<number>(
      'nostr.reconnectDelayMs',
      5000,
    );
    this.relayUrls = RelayConfigParser.parseRelayUrls(relayUrls, relayUrl);
    this.connectionManager = new RelayConnectionManager(
      NostrClientService.name,
      reconnectDelayMs,
    );
  }

  async onModuleInit() {
    this.logger.log(
      `Initializing Nostr client with ${this.relayUrls.length} relay(s): ${this.relayUrls.join(', ')}`,
    );
    await this.connectToAllRelays();
  }

  private async connectToAllRelays() {
    // Query database for the latest event timestamp per relay to resume from
    const timestampsByRelay =
      await this.databaseService.getLatestEventTimestampsByRelay(
        this.relayUrls,
        [EVENT_AMB_KIND, EVENT_FILE_KIND, EVENT_DELETE_KIND],
      );

    for (const url of this.relayUrls) {
      const latestTimestamp = timestampsByRelay.get(url);

      if (latestTimestamp !== null && latestTimestamp !== undefined) {
        this.logger.log(
          `Resuming event sync for ${url} from timestamp ${latestTimestamp} (${new Date(latestTimestamp * 1000).toISOString()})`,
        );
      } else {
        this.logger.log(
          `No existing events found for ${url}, performing full sync`,
        );
      }

      await this.connectToRelay(url, latestTimestamp ?? null);
    }
  }

  onModuleDestroy() {
    this.logger.log('Shutting down Nostr client...');
    this.isShuttingDown = true;

    // Clean up all relay connections
    for (const connection of this.connections.values()) {
      this.connectionManager.closeConnection(connection);
    }

    this.connections.clear();
    this.logger.log('All relay connections closed');
  }

  private async connectToRelay(
    url: string,
    initialTimestamp: number | null = null,
  ) {
    // Preserve existing timestamp on reconnection
    const existingConnection = this.connections.get(url);
    const timestampToUse =
      existingConnection?.lastEventTimestamp ?? initialTimestamp;

    const connection = await this.connectionManager.connect(
      url,
      () => this.isShuttingDown,
      (reconnectUrl) => this.scheduleReconnectForRelay(reconnectUrl),
      timestampToUse,
    );

    if (connection) {
      this.connections.set(url, connection);
      this.subscribeToRelay(connection);
    } else {
      this.scheduleReconnectForRelay(url);
    }
  }

  private scheduleReconnectForRelay(url: string) {
    this.connectionManager.scheduleReconnect(
      url,
      this.connections,
      () => this.isShuttingDown,
      (reconnectUrl) => this.connectToRelay(reconnectUrl),
    );
  }

  private subscribeToRelay(connection: RelayConnection) {
    if (this.isShuttingDown) {
      return;
    }

    this.connectionManager.subscribe(connection, {
      onEvent: (event, relayUrl) => this.handleEvent(event, relayUrl),
      onEose: (relayUrl) => this.handleEose(relayUrl),
    });
  }

  private async handleEose(relayUrl: string): Promise<void> {
    this.logger.debug(`Processing EOSE for relay: ${relayUrl}`);
    await this.processHistoricalOerEvents();
    await this.processHistoricalDeletions();
    this.hasReceivedEose = true;
  }

  private async handleEvent(event: Event, relayUrl: string) {
    // Verify event signature before processing
    const validationResult = EventValidator.validateSignature(event);
    if (!validationResult.valid) {
      this.logger.warn(
        EventValidator.formatValidationError(validationResult, relayUrl),
      );
      return;
    }

    // Update last seen timestamp for this relay to enable incremental sync on reconnection
    // Do this before saving to track all valid events, including duplicates
    this.updateLastEventTimestamp(relayUrl, event.created_at);

    const result = await this.databaseService.saveEvent(event, relayUrl);

    if (!result.success) {
      this.handleSaveFailure(result, event, relayUrl);
      return;
    }

    this.logger.debug(
      `Created new event from ${relayUrl}: ${event.id} (kind: ${event.kind})`,
    );

    // Process deletion events (kind 5) immediately
    if (event.kind === EVENT_DELETE_KIND) {
      try {
        await this.eventDeletionService.processDeleteEvent(event);
      } catch (deletionError) {
        // Log deletion errors but don't fail the event ingestion
        this.logger.error(
          `Deletion processing failed for event ${event.id}: ${DatabaseErrorClassifier.extractErrorMessage(deletionError)}`,
          DatabaseErrorClassifier.extractStackTrace(deletionError),
        );
      }
    }

    await this.extractOerIfApplicable(result.event);
  }

  private handleSaveFailure(
    result: Extract<
      Awaited<ReturnType<NostrEventDatabaseService['saveEvent']>>,
      { success: false }
    >,
    event: Event,
    relayUrl: string,
  ): void {
    if (result.reason === 'duplicate') {
      this.logger.debug(`Event already exists from ${relayUrl}: ${event.id}`);
      return;
    }

    this.logger.error(
      `Failed to persist event ${event.id} from ${relayUrl}: ${DatabaseErrorClassifier.extractErrorMessage(result.error)}`,
      DatabaseErrorClassifier.extractStackTrace(result.error),
    );
  }

  /**
   * Updates the last event timestamp for a relay connection.
   * This enables incremental synchronization on reconnection.
   *
   * @param relayUrl - The relay URL
   * @param eventTimestamp - Unix timestamp (seconds) of the received event
   */
  private updateLastEventTimestamp(
    relayUrl: string,
    eventTimestamp: number,
  ): void {
    const connection = this.connections.get(relayUrl);
    if (!connection) {
      return;
    }

    // Update if this is the first timestamp or if it's more recent
    if (
      connection.lastEventTimestamp === null ||
      eventTimestamp > connection.lastEventTimestamp
    ) {
      connection.lastEventTimestamp = eventTimestamp;
    }
  }

  private async extractOerIfApplicable(nostrEvent: NostrEvent): Promise<void> {
    // Extract OER data for kind 30142 (AMB) events (only after EOSE to ensure dependencies exist)
    if (
      this.hasReceivedEose &&
      this.oerExtractionService.shouldExtractOer(nostrEvent.kind)
    ) {
      try {
        await this.oerExtractionService.extractOerFromEvent(nostrEvent);
      } catch (oerError) {
        // Log OER extraction errors but don't fail the event ingestion
        this.logger.error(
          `OER extraction failed for event ${nostrEvent.id}: ${DatabaseErrorClassifier.extractErrorMessage(oerError)}`,
          DatabaseErrorClassifier.extractStackTrace(oerError),
        );
      }
    }
  }

  /**
   * Processes all historical kind 30142 (AMB) events after EOSE.
   * This ensures all referenced events are in the database before extraction.
   */
  private async processHistoricalOerEvents() {
    try {
      this.logger.log('Processing historical OER events...');

      // Find all kind 30142 (AMB) events that don't have OER records yet
      const ambEvents = await this.databaseService.findUnprocessedOerEvents();

      this.logger.log(
        `Found ${ambEvents.length} kind ${EVENT_AMB_KIND} events without OER records`,
      );

      for (const event of ambEvents) {
        try {
          await this.oerExtractionService.extractOerFromEvent(event);
        } catch (error) {
          // Duplicate key errors are expected and can be safely ignored
          if (DatabaseErrorClassifier.isDuplicateKeyError(error)) {
            this.logger.debug(
              `OER already exists for event ${event.id}, skipping`,
            );
            continue;
          }

          this.logger.error(
            `Failed to extract OER for historical event ${event.id}: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
            DatabaseErrorClassifier.extractStackTrace(error),
          );
        }
      }

      // Backfill missing file metadata in existing OER records
      await this.backfillMissingFileMetadata();

      this.logger.log('Completed processing historical OER events');
    } catch (error) {
      this.logger.error(
        `Failed to process historical OER events: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
    }
  }

  /**
   * Updates existing OER records that have event_file_id but missing file metadata.
   * This handles cases where OER was extracted before the file event arrived.
   */
  private async backfillMissingFileMetadata() {
    try {
      this.logger.log('Backfilling missing file metadata in OER records...');

      const oersWithMissingMetadata =
        await this.oerExtractionService.findOersWithMissingFileMetadata();

      this.logger.log(
        `Found ${oersWithMissingMetadata.length} OER records with missing file metadata`,
      );

      for (const oer of oersWithMissingMetadata) {
        try {
          await this.oerExtractionService.updateFileMetadata(oer);
        } catch (error) {
          this.logger.error(
            `Failed to backfill file metadata for OER ${oer.id}: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
            DatabaseErrorClassifier.extractStackTrace(error),
          );
        }
      }

      this.logger.log('Completed backfilling file metadata');
    } catch (error) {
      this.logger.error(
        `Failed to backfill file metadata: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
    }
  }

  /**
   * Processes all historical kind 5 (deletion) events after EOSE.
   * This ensures all deletion requests are applied to existing events.
   */
  private async processHistoricalDeletions() {
    try {
      this.logger.log('Processing historical deletion events...');

      // Find all kind 5 (deletion) events
      const deleteEvents = await this.databaseService.findEvents({
        kind: EVENT_DELETE_KIND,
      });

      this.logger.log(
        `Found ${deleteEvents.length} kind ${EVENT_DELETE_KIND} deletion events`,
      );

      for (const deleteEvent of deleteEvents) {
        try {
          // Convert NostrEvent entity to Event type expected by deletion service
          const event = deleteEvent.raw_event as unknown as Event;
          await this.eventDeletionService.processDeleteEvent(event);
        } catch (error) {
          this.logger.error(
            `Failed to process historical deletion event ${deleteEvent.id}: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
            DatabaseErrorClassifier.extractStackTrace(error),
          );
        }
      }

      this.logger.log('Completed processing historical deletion events');
    } catch (error) {
      this.logger.error(
        `Failed to process historical deletions: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
    }
  }
}
