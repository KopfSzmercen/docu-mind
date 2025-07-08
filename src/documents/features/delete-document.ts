import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Delete,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';
import {
  IVectorStoreService,
  IVectorStoreServiceToken,
} from 'src/documents/infrastructure/vector-store/vector-store.service';
import { Document } from 'src/documents/document.entity';

export default class DeleteDocument extends DocumentsControllerBase {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: EntityRepository<Document>,
    @Inject(IVectorStoreServiceToken)
    private readonly vectorStoreService: IVectorStoreService,
  ) {
    super();
  }

  @ApiOperation({
    summary: 'Delete a document',
    description: 'Deletes a document by its ID.',
  })
  @HttpCode(204)
  @Delete(':id')
  async deleteDocument(
    @Req() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const documentExists =
      (await this.documentRepository.count({
        userId: user.userId,
        id,
      })) > 0;

    if (!documentExists) {
      throw new NotFoundException('Document not found');
    }

    await this.vectorStoreService.deleteDocument(id, user.userId);

    await this.documentRepository.nativeDelete({
      userId: user.userId,
      id,
    });
  }
}
