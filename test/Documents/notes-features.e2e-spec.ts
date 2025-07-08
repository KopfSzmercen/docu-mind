import { EntityRepository } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import * as bcrypt from 'bcrypt';
import { Document } from 'src/documents/document.entity';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import { AddNoteResponse } from 'src/documents/features/add-note';
import { BrowseNotesResponse } from 'src/documents/features/browse-notes';
import {
  IVectorStoreService,
  IVectorStoreServiceToken,
} from 'src/documents/infrastructure/vector-store/vector-store.service';
import { SignInUserResponse } from 'src/users/features/sign-in';
import { User } from 'src/users/user.entity';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { v4 } from 'uuid';
import { AppModule } from '../../src/app.module';
import { EditNoteResponse } from 'src/documents/features/edit-note';

describe('Notes features tests', () => {
  let app: INestApplication;
  let postgresTestContainer: StartedPostgreSqlContainer;

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  let vectorStoreService: IVectorStoreService;
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  let documentSplittingService: DocumentSplittingService;

  beforeAll(async () => {
    postgresTestContainer = await new PostgreSqlContainer('postgres').start();

    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          DB_HOST: postgresTestContainer.getHost(),
          DB_PORT: postgresTestContainer.getPort(),
          DB_NAME: postgresTestContainer.getDatabase(),
          DB_PASSWORD: postgresTestContainer.getPassword(),
          DB_USER: postgresTestContainer.getUsername(),
          JWT_SECRET: 'test-secret-1234566',
        };
        //eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return config[key];
      }),
    };

    const mockVectorStoreService: IVectorStoreService = {
      addDocument: jest.fn(),
      deleteDocument: jest.fn(),
      search: jest.fn(),
    };

    const mockDocumentSplittingService = {
      splitDocument: jest.fn().mockResolvedValue(['part1', 'part2']),
    };

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .overrideProvider(IVectorStoreServiceToken)
      .useValue(mockVectorStoreService)
      .overrideProvider(DocumentSplittingService)
      .useValue(mockDocumentSplittingService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    vectorStoreService = moduleFixture.get<IVectorStoreService>(
      IVectorStoreServiceToken,
    );
    documentSplittingService = moduleFixture.get<DocumentSplittingService>(
      DocumentSplittingService,
    );
  }, 120_000);

  afterAll(async () => {
    await app.close();
    await postgresTestContainer.stop();
  });

  afterEach(async () => {
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const userRepository: EntityRepository<User> = em.getRepository(User);

    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);

    const notesRepository: EntityRepository<DocumentNote> =
      em.getRepository(DocumentNote);

    await notesRepository.nativeDelete({});
    await documentRepository.nativeDelete({});
    await userRepository.nativeDelete({});
  });

  async function setupUser(): Promise<{
    accessToken: string;
    userId: string;
  }> {
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const userRepository: EntityRepository<User> = em.getRepository(User);
    const plainPassword = 'testpassword';
    const user = userRepository.create({
      fullName: 'testuser',
      email: 'test@t.pl',
      password: await bcrypt.hash(plainPassword, 10),
      id: v4(),
    });
    await em.flush();

    const signInResponse = await request(app.getHttpServer() as App)
      .post('/users/sign-in')
      .send({
        email: user.email,
        password: plainPassword,
      });

    const signInBody = signInResponse.body as SignInUserResponse;
    const accessToken = signInBody.accessToken;

    return {
      accessToken,
      userId: user.id,
    };
  }

  it('(POST /documents/:documentId/notes) should add a note to a document', async () => {
    const { accessToken, userId } = await setupUser();
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const documentId = v4();
    const document = new Document();
    document.id = documentId;
    document.userId = userId;
    document.user = em.getReference(User, userId);
    document.text = 'Sample document text';
    document.createdAt = new Date();

    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);
    documentRepository.create(document);
    await em.flush();

    const response = await request(app.getHttpServer() as App)
      .post(`/documents/${documentId}/notes`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: 'This is a note' });

    expect(response.status).toBe(201);
    expect((response.body as AddNoteResponse).id).toBeDefined();
  });

  it('(PUT /documents/:documentId/notes/:noteId) should edit a note', async () => {
    //Arrange
    const { accessToken, userId } = await setupUser();
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const documentId = v4();
    const document = new Document();
    document.id = documentId;
    document.userId = userId;
    document.user = em.getReference(User, userId);
    document.text = 'Sample document text';
    document.createdAt = new Date();

    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);
    documentRepository.create(document);
    await em.flush();

    const noteId = v4();
    const note = new DocumentNote();
    note.id = noteId;
    note.text = 'Original note text';
    note.documentId = documentId;
    note.document = em.getReference(Document, documentId);
    note.createdAt = new Date();

    const notesRepository: EntityRepository<DocumentNote> =
      em.getRepository(DocumentNote);
    notesRepository.create(note);
    await em.flush();

    //Act
    const updatedText = 'Updated note text';
    const response = await request(app.getHttpServer() as App)
      .put(`/documents/${documentId}/notes/${noteId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ text: updatedText });

    expect(response.status).toBe(200);
    const editNoteResponse = response.body as EditNoteResponse;
    expect(editNoteResponse.id).toBe(noteId);
    expect(editNoteResponse.text).toBe(updatedText);
    expect(editNoteResponse.updatedAt).toBeDefined();

    const updatedNote = await notesRepository.findOne({ id: noteId });
    expect(updatedNote?.text).toBe(updatedText);
    expect(updatedNote?.updatedAt).toBeDefined();
  });

  it('(DELETE /documents/:documentId/notes/:noteId) should delete a note', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const documentId = v4();
    const document = new Document();
    document.id = documentId;
    document.userId = userId;
    document.user = em.getReference(User, userId);
    document.text = 'Sample document text';
    document.createdAt = new Date();

    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);
    documentRepository.create(document);
    await em.flush();

    const noteId = v4();
    const note = new DocumentNote();
    note.id = noteId;
    note.text = 'Note to be deleted';
    note.documentId = documentId;
    note.document = em.getReference(Document, documentId);
    note.createdAt = new Date();

    const notesRepository: EntityRepository<DocumentNote> =
      em.getRepository(DocumentNote);
    notesRepository.create(note);
    await em.flush();

    // Act
    const response = await request(app.getHttpServer() as App)
      .delete(`/documents/${documentId}/notes/${noteId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(204);

    // Assert
    const deletedNote = await notesRepository.findOne({ id: noteId });
    expect(deletedNote).toBeNull();
  });

  it('(GET /documents/:documentId/notes) should browse notes for a document', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const documentId = v4();
    const document = new Document();
    document.id = documentId;
    document.userId = userId;
    document.user = em.getReference(User, userId);
    document.text = 'Sample document text';
    document.createdAt = new Date();

    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);
    documentRepository.create(document);
    await em.flush();

    // Create multiple notes
    const notesRepository: EntityRepository<DocumentNote> =
      em.getRepository(DocumentNote);

    const note1Id = v4();
    const note1 = new DocumentNote();
    note1.id = note1Id;
    note1.text = 'First note';
    note1.documentId = documentId;
    note1.document = em.getReference(Document, documentId);
    note1.createdAt = new Date();

    const note2Id = v4();
    const note2 = new DocumentNote();
    note2.id = note2Id;
    note2.text = 'Second note';
    note2.documentId = documentId;
    note2.document = em.getReference(Document, documentId);
    note2.createdAt = new Date();

    notesRepository.create(note1);
    notesRepository.create(note2);
    await em.flush();

    // Act
    const response = await request(app.getHttpServer() as App)
      .get(`/documents/${documentId}/notes`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(response.status).toBe(200);
    const browseNotesResponse = response.body as BrowseNotesResponse;
    expect(browseNotesResponse.notes).toHaveLength(2);
    expect(browseNotesResponse.notes[0].id).toBeDefined();
    expect(browseNotesResponse.notes[0].text).toBeDefined();
    expect(browseNotesResponse.notes[0].createdAt).toBeDefined();
    expect(browseNotesResponse.notes[1].id).toBeDefined();
    expect(browseNotesResponse.notes[1].text).toBeDefined();
    expect(browseNotesResponse.notes[1].createdAt).toBeDefined();
  });
});
