import { CreateRequestContext, MikroORM } from '@mikro-orm/core';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class MigratorService implements OnModuleInit {
  private readonly logger = new Logger(MigratorService.name);
  constructor(private readonly orm: MikroORM) {}

  @CreateRequestContext()
  public async onModuleInit(): Promise<void> {
    const migrator = this.orm.getMigrator();

    try {
      await migrator.up();
      this.logger.log('Database migration completed successfully.');
    } catch (error) {
      this.logger.error('Error during database migration:', error);
      throw error;
    }
  }
}
