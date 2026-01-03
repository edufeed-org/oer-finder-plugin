// Constants
export {
  EVENT_FILE_KIND,
  EVENT_AMB_KIND,
  EVENT_DELETE_KIND,
} from './constants/event-kinds.constants';

export {
  SOURCE_NAME_NOSTR,
  createNostrSourceIdentifier,
  createNostrSourceIdentifierWithRelay,
  createNostrSourceUri,
  extractRelayUrlFromSourceUri,
} from './constants/source.constants';

// Types
export type {
  RelayConnection,
  RelaySubscriptionConfig,
} from './types/relay-connection.types';
export { DEFAULT_SUBSCRIPTION_CONFIG } from './types/relay-connection.types';

export type {
  OerSourceEntity,
  OpenEducationalResourceEntity,
  OerExtractionServiceInterface,
} from './types/entities.types';

export type {
  FileMetadataFields,
  LicenseInfo,
  DateFields,
  UpdateDecision,
  AmbMetadata,
  FileMetadata,
} from './types/extraction.types';

// Utils
export {
  DatabaseErrorClassifier,
  PostgresErrorCode,
} from './utils/database-error.classifier';
export {
  EventValidator,
  type EventValidationResult,
} from './utils/event-validator';
export { RelayConfigParser } from './utils/relay-config.parser';
export {
  RelayConnectionManager,
  type RelayEventHandlers,
} from './utils/relay-connection.manager';
export {
  parseColonSeparatedTags,
  extractTagValues,
  findTagValue,
  parseBoolean,
  parseBigInt,
} from './utils/tag-parser.util';

// Schemas
export {
  filterAmbMetadata,
  ALLOWED_AMB_FIELDS,
} from './schemas/amb-metadata.schema';
export {
  NostrEventDataSchema,
  parseNostrEventData,
  type NostrEventData,
  type ParseNostrEventResult,
} from './schemas/nostr-event.schema';

// Services
export {
  NostrClientService,
  CONFIG_SERVICE,
} from './services/nostr-client.service';
export {
  NostrEventDatabaseService,
  OER_SOURCE_REPOSITORY,
  NOSTR_EVENT_DATABASE_SERVICE,
  type SaveEventResult,
  type FindEventCriteria,
} from './services/nostr-event-database.service';
export {
  EventDeletionService,
  OER_REPOSITORY,
  EVENT_DELETION_SERVICE,
} from './services/event-deletion.service';
export {
  OerExtractionService,
  OER_EXTRACTION_SERVICE,
} from './services/oer-extraction.service';

// Testing utilities
export {
  NostrEventFactory,
  EventFactory,
  nostrEventFixtures,
  eventFactoryHelpers,
  type NostrEventTestData,
} from './testing';
