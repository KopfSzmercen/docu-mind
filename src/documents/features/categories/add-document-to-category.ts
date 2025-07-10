import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Body,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { AuthGuard } from 'src/common/auth.guard';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { CategoriesControllerBase } from 'src/documents/categories.controller.base';
import { Category } from 'src/documents/category.entity';
import { Document } from 'src/documents/document.entity';

export class AddDocumentToCategoryRequest {
  @ApiProperty()
  @IsUUID()
  documentId: string;
}

export class AddDocumentToCategoryResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  categoryId: string;

  constructor(id: string, categoryId: string) {
    this.id = id;
    this.categoryId = categoryId;
  }
}

export default class AddDocumentToCategory extends CategoriesControllerBase {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: EntityRepository<Category>,
    @InjectRepository(Document)
    private readonly documentsRepository: EntityRepository<Document>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Post(':categoryId/documents')
  @UseGuards(AuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Add a document to a category',
    description:
      'Adds a document to a category. Only the document owner can perform this action.',
  })
  async addDocumentToCategory(
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() request: AddDocumentToCategoryRequest,
    @Req() req: any,
  ): Promise<AddDocumentToCategoryResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const category = await this.categoriesRepository.findOne({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const document = await this.documentsRepository.findOne({
      id: request.documentId,
      userId: user.userId,
    });

    if (!document) {
      throw new NotFoundException(
        'Document not found or you do not have permission to access it',
      );
    }

    if (document.categoryId === categoryId) {
      return new AddDocumentToCategoryResponse(document.id, categoryId);
    }

    document.categoryId = categoryId;
    document.category = this.em.getReference(Category, categoryId);
    await this.em.flush();

    return new AddDocumentToCategoryResponse(document.id, categoryId);
  }
}
