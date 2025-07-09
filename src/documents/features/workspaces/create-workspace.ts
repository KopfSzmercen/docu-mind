import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Workspace } from 'src/documents/workspace.entity';
import { WorkspacesControllerBase } from 'src/documents/workspaces.controller.base';
import { v4 } from 'uuid';

export class CreateWorkspaceRequest {
  @ApiProperty()
  @IsString()
  name: string;
}

export class CreateWorkspaceResponse {
  @ApiProperty()
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export default class CreateWorkspace extends WorkspacesControllerBase {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspacesRepository: EntityRepository<Workspace>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new workspace',
    description: 'Creates a new workspace for the user.',
  })
  async createWorkspace(
    @Body() request: CreateWorkspaceRequest,
    @Req() req: any,
  ): Promise<CreateWorkspaceResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const workspace = new Workspace();
    workspace.id = v4();
    workspace.name = request.name;
    workspace.userId = user.userId;

    this.workspacesRepository.create(workspace);
    await this.em.flush();

    return new CreateWorkspaceResponse(workspace.id);
  }
}
