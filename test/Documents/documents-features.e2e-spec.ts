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
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
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
import {
  UploadDocumentRequest,
  UploadDocumentResponse,
} from '../../src/documents/features/documents/upload-document';

describe('Documents features tests', () => {
  let app: INestApplication;
  let postgresTestContainer: StartedPostgreSqlContainer;

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

  it('(POST /documents) should upload a new document', async () => {
    //Arrange
    const { accessToken, userId } = await setupUser();

    const uploadDocumentRequest = new UploadDocumentRequest();
    uploadDocumentRequest.text = 'This is a test document.';

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    //Act
    const uploadResponse = await request(app.getHttpServer() as App)
      .post('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(uploadDocumentRequest);

    //Assert
    expect(uploadResponse.status).toBe(201);

    const documentId = (uploadResponse.body as UploadDocumentResponse).message;
    expect(documentId).toBeDefined();

    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);
    const createdDocument = await documentRepository.findOne({
      id: documentId,
    });

    expect(createdDocument).toBeDefined();
    expect(createdDocument!.text).toBe(uploadDocumentRequest.text);
    expect(createdDocument!.userId).toBe(userId);
  });

  it('(DELETE /documents/:id) should delete a document', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const uploadDocumentRequest = new UploadDocumentRequest();
    uploadDocumentRequest.text = 'This is a test document.';

    const uploadResponse = await request(app.getHttpServer() as App)
      .post('/documents')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(uploadDocumentRequest);

    const createdDocumentId = (uploadResponse.body as UploadDocumentResponse)
      .message;

    // Act
    const deleteResponse = await request(app.getHttpServer() as App)
      .delete(`/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(deleteResponse.status).toBe(204);

    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);

    const documentCount = await documentRepository.count({
      id: createdDocumentId,
      userId: userId,
    });
    expect(documentCount).toBe(0);

    const deleteDocumentSpy = jest.spyOn(vectorStoreService, 'deleteDocument');
    expect(deleteDocumentSpy).toHaveBeenCalledWith(createdDocumentId, userId);
  });
});
