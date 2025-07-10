import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Document } from 'src/documents/document.entity';
import { WorkspacesControllerBase } from 'src/documents/workspaces.controller.base';

export default class RemoveDocumentFromWorkspace extends WorkspacesControllerBase {
  constructor(
    @InjectRepository(Document)
    private readonly documentsRepository: EntityRepository<Document>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Delete(':workspaceId/documents/:documentId')
  @ApiOperation({
    summary: 'Remove a document from a workspace',
    description: 'Removes a document from the specified workspace.',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDocumentFromWorkspace(
    @Param('workspaceId', ParseUUIDPipe) workspaceId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: any,
  ): Promise<void> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user;

    const document = await this.documentsRepository.findOne({
      id: documentId,
      userId: user.userId,
      workspaceId: workspaceId,
    });

    if (!document) {
      throw new NotFoundException('Document not found in this workspace');
    }

    document.workspace = null;
    document.workspaceId = null;

    await this.em.flush();
  }
}
