import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Workspace } from 'src/documents/workspace.entity';
import { WorkspacesControllerBase } from 'src/documents/workspaces.controller.base';

export default class DeleteWorkspace extends WorkspacesControllerBase {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspacesRepository: EntityRepository<Workspace>,
  ) {
    super();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a workspace',
    description:
      'Deletes an existing workspace and all its associated documents.',
  })
  @ApiParam({ name: 'id', description: 'Workspace ID' })
  async deleteWorkspace(
    @Param('id') workspaceId: string,
    @Req() req: any,
  ): Promise<void> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const workspace = await this.workspacesRepository.findOne({
      id: workspaceId,
      userId: user.userId,
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.workspacesRepository.nativeDelete({ id: workspaceId });
  }
}
