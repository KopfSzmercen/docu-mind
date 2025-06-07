import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { MigratorService } from './migrator.service';

@Module({
  imports: [MikroOrmModule.forRoot()],
  controllers: [],
  providers: [MigratorService],
  exports: [MigratorService],
})
export class PersistnceModule {}
