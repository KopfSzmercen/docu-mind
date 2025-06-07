import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import RegisterUser from './features/register';
import { User } from './user.entity';
import SignInUser from './features/sign-in';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MikroOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'defaultSecretKey',
      signOptions: { expiresIn: '1h' },
      global: true,
    }),
  ],
  controllers: [RegisterUser, SignInUser],
  providers: [],
})
export class UsersModule {}
