import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { Document } from 'src/documents/document.entity';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import AddNote from 'src/documents/features/notes/add-note';
import BrowseDocunments from 'src/documents/features/documents/browse-documents';
import BrowseNotes from 'src/documents/features/notes/browse-notes';
import DeleteDocument from 'src/documents/features/documents/delete-document';
import DeleteNote from 'src/documents/features/notes/delete-note';
import EditNote from 'src/documents/features/notes/edit-note';
import QueryDocuments from 'src/documents/features/documents/query-documents';
import QueryDocumentsAi from 'src/documents/features/documents/query-documents-ai';
import UploadDocument from 'src/documents/features/documents/upload-document';
import CreateWorkspace from 'src/documents/features/workspaces/create-workspace';
import EditWorkspace from 'src/documents/features/workspaces/edit-workspace';
import DeleteWorkspace from 'src/documents/features/workspaces/delete-workspace';
import BrowseWorkspaces from 'src/documents/features/workspaces/browse-workspaces';
import { VectorStoreModule } from 'src/documents/infrastructure/vector-store/vector-store.module';
import { Workspace } from 'src/documents/workspace.entity';
import AddDocumentToWorkspace from 'src/documents/features/workspaces/add-document-to-workspace';
import RemoveDocumentFromWorkspace from 'src/documents/features/workspaces/remove-document-from-workspace';
import { Category } from 'src/documents/category.entity';
import AddCategory from 'src/documents/features/categories/add-category';
import BrowseCategories from 'src/documents/features/categories/browse-categories';
import EditCategory from 'src/documents/features/categories/edit-category';
import DeleteCategory from 'src/documents/features/categories/delete-category';
import AddDocumentToCategory from 'src/documents/features/categories/add-document-to-category';
import RemoveDocumentFromCategory from 'src/documents/features/categories/remove-document-from-category';

@Module({
  imports: [
    VectorStoreModule,
    MikroOrmModule.forFeature([Document, DocumentNote, Workspace, Category]),
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
    CreateWorkspace,
    BrowseWorkspaces,
    EditWorkspace,
    DeleteWorkspace,
    AddDocumentToWorkspace,
    RemoveDocumentFromWorkspace,
    AddCategory,
    BrowseCategories,
    EditCategory,
    DeleteCategory,
    AddDocumentToCategory,
    RemoveDocumentFromCategory,
  ],
  providers: [DocumentSplittingService],
  exports: [],
})
export class DocumentsModule {}
