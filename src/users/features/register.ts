import { BadRequestException, Body, Post } from '@nestjs/common';
import { UsersControllerBase } from '../users.controller.base';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { InjectRepository } from '@mikro-orm/nestjs';
import { User } from '../user.entity';
import { EntityManager, EntityRepository } from '@mikro-orm/postgresql';
import { v4 } from 'uuid';
import * as bcrypt from 'bcrypt';

export class RegisterUserRequest {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  username: string;

  @ApiProperty()
  @IsString()
  @MinLength(5)
  @MaxLength(50)
  password: string;

  @ApiProperty()
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export default class RegisterUser extends UsersControllerBase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Post('/register')
  async registerUser(@Body() request: RegisterUserRequest) {
    const userWithTheSameEmailExists =
      (await this.userRepository.count({
        email: request.email,
      })) > 0;

    if (userWithTheSameEmailExists)
      throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(request.password, 10);

    const user = this.userRepository.create({
      id: v4(),
      fullName: request.username,
      email: request.email,
      password: hashedPassword,
    });

    await this.em.flush();

    return user.id;
  }
}
