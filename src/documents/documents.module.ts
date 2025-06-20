import { Module } from '@nestjs/common';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import QueryDocuments from 'src/documents/features/query-documents';
import QueryDocumentsAi from 'src/documents/features/query-documents-ai';
import UploadDocument from 'src/documents/features/upload-document';
import { VectorStoreModule } from 'src/documents/infrastructure/vector-store/vector-store.module';

@Module({
  imports: [VectorStoreModule],
  controllers: [UploadDocument, QueryDocuments, QueryDocumentsAi],
  providers: [DocumentSplittingService],
  exports: [],
})
export class DocumentsModule {}
