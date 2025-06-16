import { Get, Inject, Query, Req } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { MastraRuntimeConntext, mastra } from 'src/documents/ai/mastra';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';
import {
  IVectorStoreService,
  IVectorStoreServiceToken,
} from 'src/documents/infrastructure/vector-store/vector-store.service';
import { RuntimeContext } from '@mastra/core/di';

export class SearchDocumentsAiRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;
}

class SearchDocumentsAiResponse {
  @ApiProperty()
  response: string;

  constructor(response: string) {
    this.response = response;
  }
}

export default class QueryDocumentsAi extends DocumentsControllerBase {
  constructor(
    @Inject(IVectorStoreServiceToken)
    private readonly vectorStoreService: IVectorStoreService,
  ) {
    super();
  }

  @Get('search-ai')
  async searchDocumentsAi(
    @Query() request: SearchDocumentsAiRequest,
    @Req() req: any,
  ): Promise<SearchDocumentsAiResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const agent = mastra.getAgent('documentsAgent');

    const runtimeContext = new RuntimeContext<MastraRuntimeConntext>();
    runtimeContext.set('vectorStoreService', this.vectorStoreService);
    runtimeContext.set('userId', user.userId);

    const result = await agent.generate(
      [
        {
          role: 'user',
          content: request.query,
        },
      ],
      {
        runtimeContext: runtimeContext,
      },
    );

    return new SearchDocumentsAiResponse(result.text);
  }
}
