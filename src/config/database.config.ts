import { registerAs } from '@nestjs/config';

export const getDatabaseConfig = () => {
  const baseDatabase = process.env.POSTGRES_DATABASE || 'oer-aggregator-dev';
  const database =
    process.env.NODE_ENV === 'test' ? `${baseDatabase}-test` : baseDatabase;

  return {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database,
    logging: process.env.POSTGRES_LOGGING === 'true',
  };
};

export default registerAs('database', getDatabaseConfig);
