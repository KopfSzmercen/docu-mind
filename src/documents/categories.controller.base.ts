import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@Controller('categories')
@ApiTags('Categories')
export class CategoriesControllerBase {}
