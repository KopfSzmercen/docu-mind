import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Document } from 'src/documents/document.entity';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';

export class NoteResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt?: Date;

  constructor(partial: NoteResponse) {
    this.id = partial.id;
    this.text = partial.text;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}

export class BrowseNotesResponse {
  @ApiProperty({ type: [NoteResponse] })
  notes: NoteResponse[];

  constructor(notes: NoteResponse[]) {
    this.notes = notes;
  }
}

export class BrowseNotesQuery {
  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ required: false, enum: ['createdAt'] })
  sortBy?: 'createdAt';
}

export default class BrowseNotes extends DocumentsControllerBase {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: EntityRepository<Document>,
    @InjectRepository(DocumentNote)
    private readonly documentNoteRepository: EntityRepository<DocumentNote>,
  ) {
    super();
  }

  @ApiOperation({
    summary: 'Browse notes for a document',
    description:
      'Retrieve a list of notes for the specified document with optional sorting.',
  })
  @Get(':documentId/notes')
  async browseNotes(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Query() query: BrowseNotesQuery,
    @Req() req: any,
  ): Promise<BrowseNotesResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const documentExists =
      (await this.documentRepository.count({
        userId: user.userId,
        id: documentId,
      })) > 0;

    if (!documentExists) {
      throw new NotFoundException('Document not found');
    }

    const notes = await this.documentNoteRepository.find(
      {
        documentId: documentId,
      },
      {
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'asc',
        },
      },
    );

    const noteResponses = notes.map(
      (note) =>
        new NoteResponse({
          id: note.id,
          text: note.text,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
        }),
    );

    return new BrowseNotesResponse(noteResponses);
  }
}
