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
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';

export default class DeleteNote extends DocumentsControllerBase {
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
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':documentId/notes/:noteId')
  async deleteNote(
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Req() req: any,
  ): Promise<void> {
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

    this.em.remove(note);
    await this.em.flush();
  }
}
