import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, NotFoundException, Param, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Workspace } from 'src/documents/workspace.entity';
import { WorkspacesControllerBase } from 'src/documents/workspaces.controller.base';

export class EditWorkspaceRequest {
  @ApiProperty()
  @IsString()
  name: string;
}

export class EditWorkspaceResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export default class EditWorkspace extends WorkspacesControllerBase {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspacesRepository: EntityRepository<Workspace>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Post(':id')
  @ApiOperation({
    summary: 'Edit a workspace',
    description: 'Updates the name of an existing workspace.',
  })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async editWorkspace(
    @Param('id') workspaceId: string,
    @Body() request: EditWorkspaceRequest,
    @Req() req: any,
  ): Promise<EditWorkspaceResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const workspace = await this.workspacesRepository.findOne({
      id: workspaceId,
      userId: user.userId,
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.name = request.name;
    await this.em.flush();

    return new EditWorkspaceResponse(workspace.id, workspace.name);
  }
}
