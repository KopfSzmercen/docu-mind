import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import RegisterUser from './features/register';
import { User } from './user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [RegisterUser],
  providers: [],
})
export class UsersModule {}
