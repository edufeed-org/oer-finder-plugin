import { DataSource } from 'typeorm';
import { OerSource, OpenEducationalResource } from '@edufeed-org/oer-entities';
import { getDatabaseConfig } from './config/database.config';

// DataSource for TypeORM CLI (migrations)
// Uses shared database configuration from database.config.ts
const dbConfig = getDatabaseConfig();

// Determine if we're running from compiled JS (production) or TS (development)
const isCompiled = __filename.endsWith('.js');
const migrationPath = isCompiled
  ? './dist/migrations/*.js'
  : './src/migrations/*.ts';

const AppDataSource = new DataSource({
  type: 'postgres',
  ...dbConfig,
  entities: [OerSource, OpenEducationalResource],
  migrations: [migrationPath],
  synchronize: false,
});

export default AppDataSource;
