// Config
export { nostrConfig } from './config/nostr.config';

// Constants
export {
  EVENT_FILE_KIND,
  EVENT_AMB_KIND,
  EVENT_DELETE_KIND,
} from './constants/event-kinds.constants';

export {
  SOURCE_NAME_NOSTR,
  createNostrSourceIdentifier,
  createNostrSourceUri,
} from './constants/source.constants';

// Types
export type {
  RelayConnection,
  RelaySubscriptionConfig,
} from './types/relay-connection.types';
export { DEFAULT_SUBSCRIPTION_CONFIG } from './types/relay-connection.types';

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
  parseDate,
  getLatestDate,
  createDateFields,
  extractDatesFromMetadata,
} from './utils/date-parser.util';
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
export { NostrEnvSchema, type NostrEnv } from './schemas/nostr-env.schema';

// Metadata extractors
export {
  extractAmbMetadata,
  extractFileMetadataFields,
  extractNestedId,
  extractLicenseInfo,
  extractKeywords,
  normalizeInLanguage,
} from './utils/metadata-extractor.util';

// OER entity mapper
export {
  buildOerEntity,
  updateOerEntity,
  applyFileMetadataToEntity,
} from './utils/oer-entity.mapper';

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
  OerStorageService,
  OER_STORAGE_SERVICE,
} from './services/oer-storage.service';
export {
  OerExtractionService,
  OER_EXTRACTION_SERVICE,
} from './services/oer-extraction.service';
