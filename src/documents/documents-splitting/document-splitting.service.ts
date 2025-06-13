import { Injectable } from '@nestjs/common';
import { Document } from '@langchain/core/documents';
import { TokenTextSplitter } from '@langchain/textsplitters';

@Injectable()
export class DocumentSplittingService {
  public async splitDocument(documentText: string) {
    const textSplitter = new TokenTextSplitter({
      chunkSize: 800,
      chunkOverlap: 80,
    });

    const texts = await textSplitter.splitText(documentText);

    return texts;
  }
}
