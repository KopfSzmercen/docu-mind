import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/auth.guard';

@Controller('documents')
@ApiTags('Documents')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
export class DocumentsControllerBase {}
