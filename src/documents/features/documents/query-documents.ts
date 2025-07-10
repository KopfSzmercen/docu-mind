import { Get, Inject, Query, Req } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { JwtPayload } from 'src/common/jwt-payload.type';
import { DocumentsControllerBase } from 'src/documents/documents.controller.base';
import {
  IVectorStoreService,
  IVectorStoreServiceToken,
} from 'src/documents/infrastructure/vector-store/vector-store.service';

export class SearchDocumentsRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  query: string;
}

class FoundPointResponse {
  @ApiProperty()
  documentId: string;

  @ApiProperty()
  pointId: string;

  @ApiProperty()
  text: string;

  constructor(documentId: string, pointId: string, text: string) {
    this.documentId = documentId;
    this.pointId = pointId;
    this.text = text;
  }
}

export class SearchDocumentsResponse {
  @ApiProperty({ type: [FoundPointResponse], isArray: true })
  results: FoundPointResponse[];

  @ApiProperty()
  totalCount: number;

  constructor(results: FoundPointResponse[]) {
    this.results = results;
    this.totalCount = results.length;
  }
}

export default class QueryDocuments extends DocumentsControllerBase {
  constructor(
    @Inject(IVectorStoreServiceToken)
    private readonly vectorStoreService: IVectorStoreService,
  ) {
    super();
  }

  @Get('search')
  async searchDocuments(
    @Query() request: SearchDocumentsRequest,
    @Req() req: any,
  ): Promise<SearchDocumentsResponse> {
    //eslint-disable-next-line
    const user: JwtPayload = req.user as JwtPayload;

    const results = await this.vectorStoreService.search(
      request.query,
      user.userId,
    );

    return new SearchDocumentsResponse(
      results.map(
        (result) =>
          new FoundPointResponse(
            result.documentId,
            result.pointId,
            result.text,
          ),
      ),
    );
  }
}
