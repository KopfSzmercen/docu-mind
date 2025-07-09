import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  BadRequestException,
  Body,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Document } from 'src/documents/document.entity';
import { Workspace } from 'src/documents/workspace.entity';
import { WorkspacesControllerBase } from 'src/documents/workspaces.controller.base';

export class AddDocumentToWorkspaceRequest {
  @ApiProperty()
  @IsUUID()
  documentId: string;
}

export class AddDocumentToWorkspaceResponse {
  @ApiProperty()
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export default class AddDocumentToWorkspace extends WorkspacesControllerBase {
  constructor(
    @InjectRepository(Workspace)
    private readonly workspacesRepository: EntityRepository<Workspace>,
    @InjectRepository(Document)
    private readonly documentsRepository: EntityRepository<Document>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Post(':workspaceId/documents')
  @ApiOperation({
    summary: 'Create a new workspace',
    description: 'Creates a new workspace for the user.',
  })
  async createWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Body() request: AddDocumentToWorkspaceRequest,
    @Req() req: any,
  ): Promise<AddDocumentToWorkspaceResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const document = await this.documentsRepository.findOne({
      id: request.documentId,
      userId: user.userId,
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    if (document.workspaceId && document.workspaceId !== workspaceId) {
      throw new BadRequestException(
        'Document is already in a different workspace',
      );
    }

    if (document.workspaceId === workspaceId) {
      return new AddDocumentToWorkspaceResponse(document.id);
    }

    const workspace = await this.workspacesRepository.findOne({
      id: workspaceId,
      userId: user.userId,
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    workspace.documents.add(document);
    document.workspaceId = workspaceId;

    await this.em.flush();

    return new AddDocumentToWorkspaceResponse(document.id);
  }
}
