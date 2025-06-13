import { Body, Inject, Post, Req } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';
import {
  IVectorStoreService,
  IVectorStoreServiceToken,
} from 'src/documents/infrastructure/vector-store/vector-store.service';
import { v4 } from 'uuid';

export class UploadDocumentRequest {
  @ApiProperty()
  text: string;
}

export default class UploadDocument extends DocumentsControllerBase {
  constructor(
    @Inject(IVectorStoreServiceToken)
    private readonly vectorStoreService: IVectorStoreService,
    private readonly documentSplittingService: DocumentSplittingService,
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

    await this.vectorStoreService.addDocument(
      documentId,
      user.userId,
      documentParts,
    );

    return { message: documentId };
  }
}
