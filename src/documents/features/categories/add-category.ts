import { EntityRepository, EntityManager } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Body, Post } from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { Category } from 'src/documents/category.entity';
import { CategoriesControllerBase } from 'src/documents/categories.controller.base';
import { v4 } from 'uuid';

export class CreateCategoryRequest {
  @ApiProperty()
  @IsString()
  name: string;
}

export class CreateCategoryResponse {
  @ApiProperty()
  id: string;

  constructor(id: string) {
    this.id = id;
  }
}

export default class AddCategory extends CategoriesControllerBase {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: EntityRepository<Category>,
    private readonly em: EntityManager,
  ) {
    super();
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Creates a new public category that can be used by all users.',
  })
  async createCategory(
    @Body() request: CreateCategoryRequest,
  ): Promise<CreateCategoryResponse> {
    const category = new Category();
    category.id = v4();
    category.name = request.name;

    this.categoriesRepository.create(category);
    await this.em.flush();

    return new CreateCategoryResponse(category.id);
  }
}
