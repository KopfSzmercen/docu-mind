import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import GetMe from './features/get-me';
import RegisterUser from './features/register';
import SignInUser from './features/sign-in';
import { User } from './user.entity';

@Module({
  imports: [MikroOrmModule.forFeature([User])],
  controllers: [RegisterUser, SignInUser, GetMe],
  providers: [],
})
export class UsersModule {}
