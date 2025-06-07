import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, Post, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { User } from '../user.entity';
import { UsersControllerBase } from '../users.controller.base';
import { ApiProperty } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';

export class SignInUserRequest {
  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  password: string;
}

export class SignInUserResponse {
  @ApiProperty()
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }
}

export default class SignInUser extends UsersControllerBase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private jwtService: JwtService,
  ) {
    super();
  }

  @Post('/sign-in')
  async signInUser(@Body() request: SignInUserRequest) {
    const user = await this.userRepository.findOne({
      email: request.email,
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      request.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    return new SignInUserResponse(accessToken);
  }
}
