import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Document } from 'src/documents/document.entity';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import BrowseDocunments from 'src/documents/features/browse-documents';
import DeleteDocument from 'src/documents/features/delete-document';
import QueryDocuments from 'src/documents/features/query-documents';
import QueryDocumentsAi from 'src/documents/features/query-documents-ai';
import UploadDocument from 'src/documents/features/upload-document';
import { VectorStoreModule } from 'src/documents/infrastructure/vector-store/vector-store.module';

@Module({
  imports: [VectorStoreModule, MikroOrmModule.forFeature([Document])],
  controllers: [
    UploadDocument,
    QueryDocuments,
    QueryDocumentsAi,
    BrowseDocunments,
    DeleteDocument,
  ],
  providers: [DocumentSplittingService],
  exports: [],
})
export class DocumentsModule {}
