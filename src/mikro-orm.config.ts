import { Migrator } from '@mikro-orm/migrations';
import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { config } from 'dotenv';

config();

export default defineConfig({
  dbName: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT!),
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,
  user: process.env.DB_USER,
  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],
  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },
  extensions: [Migrator],
  debug: true,
  driver: PostgreSqlDriver,
});
