import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MigratorService } from './migrator.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Migrator } from '@mikro-orm/migrations';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

const logger = new Logger('MikroORM');

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        return {
          dbName: configService.get<string>('DB_NAME'),
          port: parseInt(configService.get<string>('DB_PORT')!, 10),
          host: configService.get<string>('DB_HOST'),
          password: configService.get<string>('DB_PASSWORD'),
          user: configService.get<string>('DB_USER'),
          entities: ['dist/**/*.entity.js'],
          entitiesTs: ['src/**/*.entity.ts'],
          migrations: {
            path: 'dist/migrations',
            pathTs: 'src/migrations',
          },
          extensions: [Migrator],
          debug: true,
          driver: PostgreSqlDriver,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          logger: logger.log.bind(logger),
        };
      },
      inject: [ConfigService],
      imports: [ConfigModule],
      driver: PostgreSqlDriver,
    }),
  ],
  controllers: [],
  providers: [MigratorService],
  exports: [MigratorService],
})
export class PersistnceModule {}
