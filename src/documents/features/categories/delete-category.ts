import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import {
  Delete,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
} from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import { Category } from 'src/documents/category.entity';
import { CategoriesControllerBase } from 'src/documents/categories.controller.base';

export default class DeleteCategory extends CategoriesControllerBase {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: EntityRepository<Category>,
  ) {
    super();
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a category',
    description:
      'Deletes an existing category. Documents will have their category reference removed.',
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async deleteCategory(@Param('id') categoryId: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoriesRepository.nativeDelete({ id: categoryId });
  }
}
