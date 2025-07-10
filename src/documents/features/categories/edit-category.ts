import { EntityManager, EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, NotFoundException, Param, Put } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Category } from 'src/documents/category.entity';
import { CategoriesControllerBase } from 'src/documents/categories.controller.base';

export class EditCategoryRequest {
  @ApiProperty()
  @IsString()
  name: string;
}

export class EditCategoryResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}

export default class EditCategory extends CategoriesControllerBase {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: EntityRepository<Category>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Edit a category',
    description: 'Updates the name of an existing category.',
  })
  @ApiParam({ name: 'id', description: 'Category ID' })
  async editCategory(
    @Param('id') categoryId: string,
    @Body() request: EditCategoryRequest,
  ): Promise<EditCategoryResponse> {
    const category = await this.categoriesRepository.findOne({
      id: categoryId,
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.name = request.name;
    await this.em.flush();

    return new EditCategoryResponse(category.id, category.name);
  }
}
