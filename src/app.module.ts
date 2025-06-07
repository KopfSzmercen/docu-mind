import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PersistnceModule } from './infrastructure/persistence/persistence.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [PersistnceModule, UsersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
