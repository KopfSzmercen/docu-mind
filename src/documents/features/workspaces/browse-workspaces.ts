import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { WorkspacesControllerBase } from 'src/documents/workspaces.controller.base';
import { Workspace } from 'src/documents/workspace.entity';

export class WorkspaceResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  userId: string;

  constructor(partial: WorkspaceResponse) {
    this.id = partial.id;
    this.name = partial.name;
    this.userId = partial.userId;
  }
}

export class BrowseWorkspacesResponse {
  @ApiProperty({ type: [WorkspaceResponse] })
  workspaces: WorkspaceResponse[];

  constructor(workspaces: WorkspaceResponse[]) {
    this.workspaces = workspaces;
  }
}

export class BrowseWorkspacesQuery {
  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ required: false, enum: ['name', 'id'] })
  sortBy?: 'name' | 'id';
}

export default class BrowseWorkspaces extends WorkspacesControllerBase {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: EntityRepository<Workspace>,
  ) {
    super();
  }

  @ApiOperation({
    summary: 'Browse workspaces',
    description:
      'Retrieve a list of workspaces for the authenticated user with optional sorting.',
  })
  @Get()
  async browseWorkspaces(
    @Query() query: BrowseWorkspacesQuery,
    @Req() req: any,
  ) {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const workspaces = await this.workspaceRepository.find(
      {
        userId: user.userId,
      },
      {
        orderBy: {
          [query.sortBy || 'name']: query.sortOrder || 'asc',
        },
      },
    );

    const workspaceResponses = workspaces.map(
      (workspace) =>
        new WorkspaceResponse({
          id: workspace.id,
          name: workspace.name,
          userId: workspace.userId,
        }),
    );

    return new BrowseWorkspacesResponse(workspaceResponses);
  }
}
