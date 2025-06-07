import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Get, Req, UseGuards } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth.guard';
import { JwtPayload } from '../../common/jwt-payload.type';
import { User } from '../../users/user.entity';
import { UsersControllerBase } from '../users.controller.base';

export class GetMeResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  email: string;

  constructor(id: string, fullName: string, email: string) {
    this.id = id;
    this.fullName = fullName;
    this.email = email;
  }
}

export default class GetMe extends UsersControllerBase {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: EntityRepository<User>,
  ) {
    super();
  }

  @Get('/me')
  @UseGuards(AuthGuard)
  async getMe(@Req() request: any): Promise<GetMeResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = request.user;

    const foundUser = await this.userRepository.findOneOrFail({
      id: user.userId,
    });

    return new GetMeResponse(foundUser.id, foundUser.fullName, foundUser.email);
  }
}
