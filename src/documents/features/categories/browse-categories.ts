import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { Get, Query } from '@nestjs/common';
import { ApiOperation, ApiProperty } from '@nestjs/swagger';
import { CategoriesControllerBase } from 'src/documents/categories.controller.base';
import { Category } from 'src/documents/category.entity';

export class CategoryResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt?: Date;

  constructor(partial: CategoryResponse) {
    this.id = partial.id;
    this.name = partial.name;
    this.createdAt = partial.createdAt;
    this.updatedAt = partial.updatedAt;
  }
}

export class BrowseCategoriesResponse {
  @ApiProperty({ type: [CategoryResponse] })
  categories: CategoryResponse[];

  constructor(categories: CategoryResponse[]) {
    this.categories = categories;
  }
}

export class BrowseCategoriesQuery {
  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ required: false, enum: ['name', 'id', 'createdAt'] })
  sortBy?: 'name' | 'id' | 'createdAt';
}

export default class BrowseCategories extends CategoriesControllerBase {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: EntityRepository<Category>,
  ) {
    super();
  }

  @ApiOperation({
    summary: 'Browse categories',
    description:
      'Retrieve a list of all public categories with optional sorting.',
  })
  @Get()
  async browseCategories(
    @Query() query: BrowseCategoriesQuery,
  ): Promise<BrowseCategoriesResponse> {
    const categories = await this.categoryRepository.find(
      {},
      {
        orderBy: {
          [query.sortBy || 'name']: query.sortOrder || 'asc',
        },
      },
    );

    const categoryResponses = categories.map(
      (category) =>
        new CategoryResponse({
          id: category.id,
          name: category.name,
          createdAt: category.createdAt,
          updatedAt: category.updatedAt,
        }),
    );

    return new BrowseCategoriesResponse(categoryResponses);
  }
}
