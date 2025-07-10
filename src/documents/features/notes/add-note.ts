import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Body,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { Document } from 'src/documents/document.entity';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';
import { v4 } from 'uuid';

export class AddNoteRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class AddNoteResponse {
  @ApiProperty()
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export default class AddNote extends DocumentsControllerBase {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: EntityRepository<Document>,
    @InjectRepository(DocumentNote)
    private readonly documentNoteRepository: EntityRepository<DocumentNote>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @ApiOperation({
    summary: 'Add a note to a document',
    description: 'Creates a new note for the specified document.',
  })
  @Post(':documentId/notes')
  async addNote(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Body() request: AddNoteRequest,
    @Req() req: any,
  ): Promise<AddNoteResponse> {
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

    const noteId = v4();
    const now = new Date();

    const note = new DocumentNote();
    note.id = noteId;
    note.text = request.text;
    note.documentId = documentId;
    note.document = this.em.getReference(Document, documentId);
    note.createdAt = now;

    this.documentNoteRepository.create(note);
    await this.em.flush();

    return new AddNoteResponse(noteId);
  }
}
