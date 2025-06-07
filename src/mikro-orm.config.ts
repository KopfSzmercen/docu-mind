import { defineConfig, PostgreSqlDriver } from '@mikro-orm/postgresql';
import { Options } from '@mikro-orm/core';
import { Logger } from '@nestjs/common';
import { Migrator } from '@mikro-orm/migrations';

const logger = new Logger('MikroORM');

const config: Options<PostgreSqlDriver> = defineConfig({
  dbName: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT!, 10),
  host: process.env.DB_HOST,
  password: process.env.DB_PASSWORD,

  entities: ['dist/**/*.entity.js'],
  entitiesTs: ['src/**/*.entity.ts'],

  migrations: {
    path: 'dist/migrations',
    pathTs: 'src/migrations',
  },

  extensions: [Migrator],

  debug: true,
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  logger: logger.log.bind(logger),
});

export default config;
