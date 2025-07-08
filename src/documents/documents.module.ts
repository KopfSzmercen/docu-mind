import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Document } from 'src/documents/document.entity';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import AddNote from 'src/documents/features/add-note';
import BrowseDocunments from 'src/documents/features/browse-documents';
import BrowseNotes from 'src/documents/features/browse-notes';
import DeleteDocument from 'src/documents/features/delete-document';
import DeleteNote from 'src/documents/features/delete-note';
import EditNote from 'src/documents/features/edit-note';
import QueryDocuments from 'src/documents/features/query-documents';
import QueryDocumentsAi from 'src/documents/features/query-documents-ai';
import UploadDocument from 'src/documents/features/upload-document';
import { VectorStoreModule } from 'src/documents/infrastructure/vector-store/vector-store.module';

@Module({
  imports: [
    VectorStoreModule,
    MikroOrmModule.forFeature([Document, DocumentNote]),
  ],
  controllers: [
    UploadDocument,
    QueryDocuments,
    QueryDocumentsAi,
    BrowseDocunments,
    BrowseNotes,
    DeleteDocument,
    AddNote,
    EditNote,
    DeleteNote,
  ],
  providers: [DocumentSplittingService],
  exports: [],
})
export class DocumentsModule {}
