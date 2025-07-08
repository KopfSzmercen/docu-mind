import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Get, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';
import { Document } from 'src/documents/document.entity';

export class DocumentResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  createdAt: Date;

  constructor(partial: DocumentResponse) {
    this.id = partial.id;
    this.text = partial.text;
    this.createdAt = partial.createdAt;
  }
}

export class BrowseDocumentsResponse {
  @ApiProperty({ type: [DocumentResponse] })
  documents: DocumentResponse[];

  constructor(documents: DocumentResponse[]) {
    this.documents = documents;
  }
}

export class BrowseDocumentsQuery {
  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ required: false, enum: ['createdAt'] })
  sortBy?: 'createdAt';
}

export default class BrowseDocunments extends DocumentsControllerBase {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: EntityRepository<Document>,
  ) {
    super();
  }

  @ApiOperation({
    summary: 'Browse documents',
    description: 'Retrieve a list of documents with optional sorting.',
  })
  @Get()
  async browseDocuments(@Query() query: BrowseDocumentsQuery, @Req() req: any) {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const documents = await this.documentRepository.find(
      {
        userId: user.userId,
      },
      {
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'asc',
        },
      },
    );

    const documentResponses = documents.map(
      (doc) =>
        new DocumentResponse({
          id: doc.id,
          text: doc.text,
          createdAt: doc.createdAt,
        }),
    );

    return new BrowseDocumentsResponse(documentResponses);
  }
}
