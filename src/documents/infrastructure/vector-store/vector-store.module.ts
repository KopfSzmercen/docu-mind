import { Module } from '@nestjs/common';
import {
  EmbeddingService,
  IEmbeddingServiceToken,
} from 'src/documents/infrastructure/vector-store/embedding.service';
import {
  IVectorStoreServiceToken,
  VectorStoreService,
} from 'src/documents/infrastructure/vector-store/vector-store.service';

@Module({
  providers: [
    { provide: IVectorStoreServiceToken, useClass: VectorStoreService },
    { provide: IEmbeddingServiceToken, useClass: EmbeddingService },
  ],
  exports: [
    { provide: IVectorStoreServiceToken, useClass: VectorStoreService },
  ],
})
export class VectorStoreModule {}
