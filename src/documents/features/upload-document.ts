import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, Inject, Post, Req } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Document } from 'src/documents/document.entity';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';
import {
  IVectorStoreService,
  IVectorStoreServiceToken,
} from 'src/documents/infrastructure/vector-store/vector-store.service';
import { User } from 'src/users/user.entity';
import { v4 } from 'uuid';

export class UploadDocumentRequest {
  @ApiProperty()
  text: string;
}

export class UploadDocumentResponse {
  @ApiProperty()
  message: string;

  constructor(message: string) {
    this.message = message;
  }
}

export default class UploadDocument extends DocumentsControllerBase {
  constructor(
    @Inject(IVectorStoreServiceToken)
    private readonly vectorStoreService: IVectorStoreService,
    private readonly documentSplittingService: DocumentSplittingService,
    @InjectRepository(Document)
    private readonly documentRepository: EntityRepository<Document>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Post()
  async uploadDocument(
    @Body() request: UploadDocumentRequest,
    @Req() req: any,
  ): Promise<{ message: string }> {
    const documentParts = await this.documentSplittingService.splitDocument(
      request.text,
    );

    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;
    const documentId = v4();

    const document = new Document();
    document.id = documentId;
    document.user = this.em.getReference(User, user.userId);
    document.userId = user.userId;
    document.text = request.text;
    document.createdAt = new Date();

    await this.vectorStoreService.addDocument(
      documentId,
      user.userId,
      documentParts,
    );

    this.documentRepository.create(document);
    await this.em.flush();

    return { message: documentId };
  }
}
