import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Event } from 'nostr-tools';
import { RelayConfigParser } from '../utils/relay-config.parser';
import { EventValidator } from '../utils/event-validator';
import { DatabaseErrorClassifier } from '../utils/database-error.classifier';
import { RelayConnectionManager } from '../utils/relay-connection.manager';
import type { RelayConnection } from '../types/relay-connection.types';
import type { OerSource } from '@edufeed-org/oer-entities';
import { parseNostrEventData } from '../schemas/nostr-event.schema';
import {
  NostrEventDatabaseService,
  NOSTR_EVENT_DATABASE_SERVICE,
} from './nostr-event-database.service';
import {
  EventDeletionService,
  EVENT_DELETION_SERVICE,
} from './event-deletion.service';
import {
  OerExtractionService,
  OER_EXTRACTION_SERVICE,
} from './oer-extraction.service';
import {
  EVENT_AMB_KIND,
  EVENT_FILE_KIND,
  EVENT_DELETE_KIND,
} from '../constants/event-kinds.constants';

/**
 * Injection token for ConfigService to ensure proper DI in bundled package
 */
export const CONFIG_SERVICE = 'CONFIG_SERVICE';

@Injectable()
export class NostrClientService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NostrClientService.name);
  private readonly connections: Map<string, RelayConnection> = new Map();
  private readonly relayUrls: readonly string[];
  private readonly connectionManager: RelayConnectionManager;
  private isShuttingDown = false;
  private hasReceivedEose = false;

  constructor(
    @Inject(NOSTR_EVENT_DATABASE_SERVICE)
    private readonly databaseService: NostrEventDatabaseService,
    @Inject(OER_EXTRACTION_SERVICE)
    private readonly oerExtractionService: OerExtractionService,
    @Inject(EVENT_DELETION_SERVICE)
    private readonly eventDeletionService: EventDeletionService,
    @Inject(CONFIG_SERVICE)
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
    const enabled = this.configService.get<boolean>('nostr.enabled', false);
    if (!enabled) {
      this.logger.log(
        'Nostr ingest is disabled (set NOSTR_INGEST_ENABLED=true to enable)',
      );
      return;
    }

    this.logger.log(
      `Initializing Nostr client with ${this.relayUrls.length} relay(s): ${this.relayUrls.join(', ')}`,
    );
    await this.connectToAllRelays();
  }

  private async connectToAllRelays() {
    // Query database for the latest event timestamp per relay to resume from
    const timestampsByRelay =
      await this.databaseService.getLatestTimestampsByRelay(this.relayUrls, [
        String(EVENT_AMB_KIND),
        String(EVENT_FILE_KIND),
        String(EVENT_DELETE_KIND),
      ]);

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
    await this.processHistoricalDeletions(relayUrl);
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

    await this.extractOerIfApplicable(result.source);
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

  private async extractOerIfApplicable(oerSource: OerSource): Promise<void> {
    // Extract OER data for kind 30142 (AMB) events (only after EOSE to ensure dependencies exist)
    if (
      this.hasReceivedEose &&
      oerSource.source_record_type !== null &&
      this.oerExtractionService.shouldExtractOer(
        parseInt(oerSource.source_record_type, 10),
      )
    ) {
      try {
        await this.oerExtractionService.extractOerFromSource(oerSource);
      } catch (oerError) {
        // Log OER extraction errors but don't fail the event ingestion
        this.logger.error(
          `OER extraction failed for source ${oerSource.id}: ${DatabaseErrorClassifier.extractErrorMessage(oerError)}`,
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

      for (const source of ambEvents) {
        try {
          await this.oerExtractionService.extractOerFromSource(source);
        } catch (error) {
          // Duplicate key errors are expected and can be safely ignored
          if (DatabaseErrorClassifier.isDuplicateKeyError(error)) {
            this.logger.debug(
              `OER already exists for source ${source.id}, skipping`,
            );
            continue;
          }

          this.logger.error(
            `Failed to extract OER for historical source ${source.id}: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
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
   * Updates existing OER records that have file event sources but missing file metadata.
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
   * Processes all historical kind 5 (deletion) events after EOSE for a specific relay.
   * This ensures all deletion requests from that relay are applied to existing events.
   *
   * @param relayUrl - The relay URL to process deletions for
   */
  private async processHistoricalDeletions(relayUrl: string) {
    try {
      this.logger.log(
        `Processing historical deletion events for relay: ${relayUrl}`,
      );

      // Find all kind 5 (deletion) events from this specific relay
      const deleteEvents = await this.databaseService.findEvents({
        source_record_type: String(EVENT_DELETE_KIND),
        source_uri: relayUrl,
      });

      this.logger.log(
        `Found ${deleteEvents.length} kind ${EVENT_DELETE_KIND} deletion events from ${relayUrl}`,
      );

      for (const deleteSource of deleteEvents) {
        try {
          // Extract and validate Event from source_data
          const parseResult = parseNostrEventData(deleteSource.source_data);
          if (!parseResult.success) {
            this.logger.error(
              `Invalid source_data for deletion source ${deleteSource.id}: ${parseResult.error}`,
            );
            continue;
          }
          // NostrEventData is structurally compatible with Event
          const event = parseResult.data as Event;
          await this.eventDeletionService.processDeleteEvent(event);
        } catch (error) {
          this.logger.error(
            `Failed to process historical deletion source ${deleteSource.id}: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
            DatabaseErrorClassifier.extractStackTrace(error),
          );
        }
      }

      this.logger.log(
        `Completed processing historical deletion events for ${relayUrl}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process historical deletions for ${relayUrl}: ${DatabaseErrorClassifier.extractErrorMessage(error)}`,
        DatabaseErrorClassifier.extractStackTrace(error),
      );
    }
  }
}
