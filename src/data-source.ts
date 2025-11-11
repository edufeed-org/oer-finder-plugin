import { DataSource } from 'typeorm';
import { NostrEvent } from './nostr/entities/nostr-event.entity';
import { OpenEducationalResource } from './oer/entities/open-educational-resource.entity';
import { getDatabaseConfig } from './config/database.config';

// DataSource for TypeORM CLI (migrations)
// Uses shared database configuration from database.config.ts
const dbConfig = getDatabaseConfig();

export const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  entities: [NostrEvent, OpenEducationalResource],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
