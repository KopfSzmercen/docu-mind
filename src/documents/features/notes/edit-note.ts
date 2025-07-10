import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Body,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Put,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';

export class EditNoteRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  text: string;
}

export class EditNoteResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  text: string;

  @ApiProperty()
  updatedAt: Date;

  constructor(id: string, text: string, updatedAt: Date) {
    this.id = id;
    this.text = text;
    this.updatedAt = updatedAt;
  }
}

export default class EditNote extends DocumentsControllerBase {
  constructor(
    @InjectRepository(DocumentNote)
    private readonly documentNoteRepository: EntityRepository<DocumentNote>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @ApiOperation({
    summary: 'Edit a note',
    description: 'Updates the text of an existing note.',
  })
  @Put(':documentId/notes/:noteId')
  async editNote(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() request: EditNoteRequest,
    @Req() req: any,
  ): Promise<EditNoteResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const note = await this.documentNoteRepository.findOne({
      id: noteId,
      document: {
        id: documentId,
        userId: user.userId,
      },
    });

    if (!note) {
      throw new NotFoundException('Note not found');
    }

    // Update the note
    const now = new Date();
    note.text = request.text;
    note.updatedAt = now;

    await this.em.flush();

    return new EditNoteResponse(note.id, note.text, note.updatedAt);
  }
}
