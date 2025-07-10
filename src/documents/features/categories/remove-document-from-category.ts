import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Delete,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/auth.guard';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { CategoriesControllerBase } from 'src/documents/categories.controller.base';
import { Category } from 'src/documents/category.entity';
import { Document } from 'src/documents/document.entity';

export default class RemoveDocumentFromCategory extends CategoriesControllerBase {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: EntityRepository<Category>,
    @InjectRepository(Document)
    private readonly documentsRepository: EntityRepository<Document>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Delete(':categoryId/documents/:documentId')
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Remove a document from a category',
    description:
      'Removes a document from a category. Only the document owner can perform this action.',
  })
  async removeDocumentFromCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Param('documentId', ParseUUIDPipe) documentId: string,
    @Req() req: any,
  ): Promise<void> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const category = await this.categoriesRepository.findOne({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const document = await this.documentsRepository.findOne({
      id: documentId,
      userId: user.userId,
      categoryId: categoryId,
    });

    if (!document) {
      throw new NotFoundException(
        'Document not found, you do not have permission to access it, or it is not in this category',
      );
    }

    document.categoryId = null;
    document.category = null;
    await this.em.flush();
  }
}
