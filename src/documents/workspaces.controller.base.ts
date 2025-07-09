import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/auth.guard';

@Controller('workspaces')
@ApiTags('Workspaces')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard)
export class WorkspacesControllerBase {}
