import { EntityRepository, MikroORM } from '@mikro-orm/core';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import * as bcrypt from 'bcrypt';
import { AppModule } from 'src/app.module';
import { Document } from 'src/documents/document.entity';
import { DocumentNote } from 'src/documents/documentNote.entity';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import {
  UploadDocumentRequest,
  UploadDocumentResponse,
} from 'src/documents/features/upload-document';
import { AddDocumentToWorkspaceRequest } from 'src/documents/features/workspaces/add-document-to-workspace';
import {
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
} from 'src/documents/features/workspaces/create-workspace';
import {
  EditWorkspaceRequest,
  EditWorkspaceResponse,
} from 'src/documents/features/workspaces/edit-workspace';
import {
  IVectorStoreService,
  IVectorStoreServiceToken,
} from 'src/documents/infrastructure/vector-store/vector-store.service';
import { Workspace } from 'src/documents/workspace.entity';
import { SignInUserResponse } from 'src/users/features/sign-in';
import { User } from 'src/users/user.entity';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { v4 } from 'uuid';

describe('Workspaces features tests', () => {
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

    const workspaceRepository: EntityRepository<Workspace> =
      em.getRepository(Workspace);

    await notesRepository.nativeDelete({});
    await documentRepository.nativeDelete({});
    await userRepository.nativeDelete({});
    await workspaceRepository.nativeDelete({});
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

  it('(POST /workspaces) should create a workspace', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();

    const createWorkspaceRequest = new CreateWorkspaceRequest();
    createWorkspaceRequest.name = 'Test Workspace';

    // Act
    const response = await request(app.getHttpServer() as App)
      .post('/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createWorkspaceRequest);

    // Assert
    expect(response.status).toBe(201);

    const responseBody = response.body as CreateWorkspaceResponse;
    expect(responseBody).toHaveProperty('id');

    const orm = app.get(MikroORM);
    const em = orm.em.fork();

    const workspace = em.getRepository(Workspace.name).findOne({
      userId: userId,
      id: responseBody.id,
    });

    expect(workspace).toBeDefined();
  });

  it('(POST /workspaces/:id) should edit a workspace', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    // Create a workspace first
    const createWorkspaceRequest = new CreateWorkspaceRequest();
    createWorkspaceRequest.name = 'Test Workspace';

    const createResponse = await request(app.getHttpServer() as App)
      .post('/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createWorkspaceRequest);

    const createResponseBody = createResponse.body as CreateWorkspaceResponse;
    const workspaceId = createResponseBody.id;

    // Update the workspace
    const editWorkspaceRequest = new EditWorkspaceRequest();
    editWorkspaceRequest.name = 'Updated Workspace Name';

    // Act
    const response = await request(app.getHttpServer() as App)
      .post(`/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(editWorkspaceRequest);

    // Assert
    expect(response.status).toBe(201);

    const responseBody = response.body as EditWorkspaceResponse;
    expect(responseBody.id).toBe(workspaceId);
    expect(responseBody.name).toBe('Updated Workspace Name');

    // Verify in database
    const orm = app.get(MikroORM);
    const em = orm.em.fork();

    const workspace = await em.getRepository(Workspace).findOne({
      id: workspaceId,
    });

    expect(workspace).toBeDefined();
    expect(workspace?.name).toBe('Updated Workspace Name');
  });

  it('(DELETE /workspaces/:id) should delete a workspace', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    // Create a workspace first
    const createWorkspaceRequest = new CreateWorkspaceRequest();
    createWorkspaceRequest.name = 'Test Workspace to Delete';

    const createResponse = await request(app.getHttpServer() as App)
      .post('/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createWorkspaceRequest);

    const createResponseBody = createResponse.body as CreateWorkspaceResponse;
    const workspaceId = createResponseBody.id;

    // Act
    const response = await request(app.getHttpServer() as App)
      .delete(`/workspaces/${workspaceId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(response.status).toBe(HttpStatus.NO_CONTENT);
    const orm = app.get(MikroORM);
    const em = orm.em.fork();

    const workspace = await em.getRepository(Workspace).findOne({
      id: workspaceId,
    });

    expect(workspace).toBeNull();
  });

  it('(POST /workspaces/:id) should return 404 when editing non-existent workspace', async () => {
    // Arrange
    const { accessToken } = await setupUser();
    const nonExistentWorkspaceId = v4();

    const editWorkspaceRequest = new EditWorkspaceRequest();
    editWorkspaceRequest.name = 'Updated Name';

    // Act
    const response = await request(app.getHttpServer() as App)
      .post(`/workspaces/${nonExistentWorkspaceId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(editWorkspaceRequest);

    // Assert
    expect(response.status).toBe(404);
  });

  it('(DELETE /workspaces/:id) should return 404 when deleting non-existent workspace', async () => {
    // Arrange
    const { accessToken } = await setupUser();
    const nonExistentWorkspaceId = v4();

    // Act
    const response = await request(app.getHttpServer() as App)
      .delete(`/workspaces/${nonExistentWorkspaceId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(response.status).toBe(404);
  });

  it('(POST /workspaces/:id/documents) should add a document to a workspace', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();

    const createWorkspaceRequest = new CreateWorkspaceRequest();
    createWorkspaceRequest.name = 'Test Workspace for Document';

    const createDocumentRequest = new UploadDocumentRequest();
    createDocumentRequest.text = 'Test Document Text';

    const createDocumentResponse = await request(app.getHttpServer() as App)
      .post('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDocumentRequest);

    const createDocumentResponseBody =
      createDocumentResponse.body as UploadDocumentResponse;

    const createWorkspaceResponse = await request(app.getHttpServer() as App)
      .post('/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createWorkspaceRequest);

    const createWorkspaceResponseBody =
      createWorkspaceResponse.body as CreateWorkspaceResponse;

    const addDocumentToWorkspaceRequest = new AddDocumentToWorkspaceRequest();
    addDocumentToWorkspaceRequest.documentId =
      createDocumentResponseBody.message;
    // Act

    const addDocumentToWorkspaceResponse = await request(
      app.getHttpServer() as App,
    )
      .post(`/workspaces/${createWorkspaceResponseBody.id}/documents`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(addDocumentToWorkspaceRequest);

    // Assert
    expect(addDocumentToWorkspaceResponse.status).toBe(201);

    const orm = app.get(MikroORM);
    const em = orm.em.fork();

    const workspaceRepository: EntityRepository<Workspace> =
      em.getRepository(Workspace);

    const workspace = await workspaceRepository.findOne(
      {
        id: createWorkspaceResponseBody.id,
        userId: userId,
      },
      {
        populate: ['documents'],
      },
    );

    expect(workspace).toBeDefined();
    expect(workspace?.documents).toHaveLength(1);
    expect(workspace?.documents[0].id).toBe(createDocumentResponseBody.message);
  });

  it('(DELETE /workspaces/:workspaceId/documents/:documentId) should remove a document from a workspace', async () => {
    // Arrange
    const { accessToken } = await setupUser();
    const createWorkspaceRequest = new CreateWorkspaceRequest();
    createWorkspaceRequest.name = 'Test Workspace for Document Removal';

    const createDocumentRequest = new UploadDocumentRequest();
    createDocumentRequest.text = 'Test Document Text for Removal';

    const createDocumentResponse = await request(app.getHttpServer() as App)
      .post('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createDocumentRequest);

    const createDocumentResponseBody =
      createDocumentResponse.body as UploadDocumentResponse;

    const createWorkspaceResponse = await request(app.getHttpServer() as App)
      .post('/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createWorkspaceRequest);

    const createWorkspaceResponseBody =
      createWorkspaceResponse.body as CreateWorkspaceResponse;

    const addDocumentToWorkspaceRequest = new AddDocumentToWorkspaceRequest();
    addDocumentToWorkspaceRequest.documentId =
      createDocumentResponseBody.message;

    await request(app.getHttpServer() as App)
      .post(`/workspaces/${createWorkspaceResponseBody.id}/documents`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(addDocumentToWorkspaceRequest);

    // Act
    const removeDocumentResponse = await request(app.getHttpServer() as App)
      .delete(
        `/workspaces/${createWorkspaceResponseBody.id}/documents/${createDocumentResponseBody.message}`,
      )
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(removeDocumentResponse.status).toBe(HttpStatus.NO_CONTENT);

    const orm = app.get(MikroORM);
    const em = orm.em.fork();
    const workspaceRepository: EntityRepository<Workspace> =
      em.getRepository(Workspace);

    const workspace = await workspaceRepository.findOne(
      {
        id: createWorkspaceResponseBody.id,
      },
      {
        populate: ['documents'],
      },
    );

    expect(workspace).toBeDefined();
    expect(workspace?.documents).toHaveLength(0);
  });

  it('(GET /workspaces) should browse workspaces', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();

    const createWorkspaceRequest1 = new CreateWorkspaceRequest();
    createWorkspaceRequest1.name = 'A';

    const createWorkspaceResponse1 = await request(app.getHttpServer() as App)
      .post('/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createWorkspaceRequest1);

    const createWorkspaceResponseBody1 =
      createWorkspaceResponse1.body as CreateWorkspaceResponse;

    const createWorkspaceRequest2 = new CreateWorkspaceRequest();
    createWorkspaceRequest2.name = 'B';

    const createWorkspaceResponse2 = await request(app.getHttpServer() as App)
      .post('/workspaces')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createWorkspaceRequest2);

    const createWorkspaceResponseBody2 =
      createWorkspaceResponse2.body as CreateWorkspaceResponse;

    // Act
    const response = await request(app.getHttpServer() as App)
      .get('/workspaces?sortBy=name&sortOrder=asc')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(response.status).toBe(200);
    const responseBody = response.body as { workspaces: Workspace[] };
    expect(responseBody.workspaces).toHaveLength(2);
    expect(responseBody.workspaces[0].id).toBe(createWorkspaceResponseBody1.id);
    expect(responseBody.workspaces[0].name).toBe('A');
    expect(responseBody.workspaces[0].userId).toBe(userId);
    expect(responseBody.workspaces[1].id).toBe(createWorkspaceResponseBody2.id);
    expect(responseBody.workspaces[1].name).toBe('B');
    expect(responseBody.workspaces[1].userId).toBe(userId);
  });
});
