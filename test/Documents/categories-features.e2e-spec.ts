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
import { Category } from 'src/documents/category.entity';
import { Document } from 'src/documents/document.entity';
import { DocumentSplittingService } from 'src/documents/documents-splitting/document-splitting.service';
import {
  CreateCategoryRequest,
  CreateCategoryResponse,
} from 'src/documents/features/categories/add-category';
import {
  AddDocumentToCategoryRequest,
  AddDocumentToCategoryResponse,
} from 'src/documents/features/categories/add-document-to-category';
import {
  BrowseCategoriesQuery,
  BrowseCategoriesResponse,
} from 'src/documents/features/categories/browse-categories';
import {
  EditCategoryRequest,
  EditCategoryResponse,
} from 'src/documents/features/categories/edit-category';
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
import { AppModule } from '../../src/app.module';

describe('Categories features tests', () => {
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

    const workspaceRepository: EntityRepository<Workspace> =
      em.getRepository(Workspace);

    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);

    await categoryRepository.nativeDelete({});
    await workspaceRepository.nativeDelete({});
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

  it('(POST /categories) should create a new category', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    const createCategoryRequest: CreateCategoryRequest = {
      name: 'Test Category',
    };

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    // Act
    const createResponse = await request(app.getHttpServer() as App)
      .post('/categories')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(createCategoryRequest);

    // Assert
    expect(createResponse.status).toBe(201);

    const categoryId = (createResponse.body as CreateCategoryResponse).id;
    expect(categoryId).toBeDefined();

    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);
    const createdCategory = await categoryRepository.findOne({
      id: categoryId,
    });

    expect(createdCategory).toBeDefined();
    expect(createdCategory!.name).toBe(createCategoryRequest.name);
    expect(createdCategory!.createdAt).toBeDefined();
  });

  it('(GET /categories) should browse categories', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);

    // Create test categories
    categoryRepository.create({
      id: v4(),
      name: 'Category A',
      createdAt: new Date(),
    });
    categoryRepository.create({
      id: v4(),
      name: 'Category B',
      createdAt: new Date(),
    });
    await em.flush();

    // Act
    const browseResponse = await request(app.getHttpServer() as App)
      .get('/categories')
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(browseResponse.status).toBe(200);

    const responseBody = browseResponse.body as BrowseCategoriesResponse;
    expect(responseBody.categories).toHaveLength(2);
    expect(responseBody.categories[0].name).toBe('Category A'); // sorted by name asc by default
    expect(responseBody.categories[1].name).toBe('Category B');
    expect(responseBody.categories[0].id).toBeDefined();
    expect(responseBody.categories[0].createdAt).toBeDefined();
  });

  it('(GET /categories) should browse categories with custom sorting', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);

    // Create test categories
    categoryRepository.create({
      id: v4(),
      name: 'Category A',
      createdAt: new Date(),
    });
    categoryRepository.create({
      id: v4(),
      name: 'Category B',
      createdAt: new Date(),
    });
    await em.flush();

    // Act
    const browseResponse = await request(app.getHttpServer() as App)
      .get('/categories')
      .query({ sortBy: 'name', sortOrder: 'desc' } as BrowseCategoriesQuery)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(browseResponse.status).toBe(200);

    const responseBody = browseResponse.body as BrowseCategoriesResponse;
    expect(responseBody.categories).toHaveLength(2);
    expect(responseBody.categories[0].name).toBe('Category B'); // sorted by name desc
    expect(responseBody.categories[1].name).toBe('Category A');
  });

  it('(PUT /categories/:id) should edit a category', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);

    // Create a test category
    const category = categoryRepository.create({
      id: v4(),
      name: 'Original Category Name',
      createdAt: new Date(),
    });
    await em.flush();

    const editCategoryRequest: EditCategoryRequest = {
      name: 'Updated Category Name',
    };

    // Act
    const editResponse = await request(app.getHttpServer() as App)
      .put(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(editCategoryRequest);

    // Assert
    expect(editResponse.status).toBe(200);

    const responseBody = editResponse.body as EditCategoryResponse;
    expect(responseBody.id).toBe(category.id);
    expect(responseBody.name).toBe(editCategoryRequest.name);

    // Verify the category was actually updated in the database
    const updatedCategory = await categoryRepository.findOne({
      id: category.id,
    });
    expect(updatedCategory!.name).toBe(editCategoryRequest.name);
    expect(updatedCategory!.updatedAt).toBeDefined();
  });

  it('(DELETE /categories/:id) should delete a category', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);

    // Create a test category
    const category = categoryRepository.create({
      id: v4(),
      name: 'Category to Delete',
      createdAt: new Date(),
    });
    await em.flush();

    // Act
    const deleteResponse = await request(app.getHttpServer() as App)
      .delete(`/categories/${category.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(deleteResponse.status).toBe(204);

    // Verify the category was actually deleted from the database
    const deletedCategory = await categoryRepository.findOne({
      id: category.id,
    });
    expect(deletedCategory).toBeNull();
  });

  it('(POST /categories/:id/documents) should add a document to a category', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);
    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);

    // Create a test category
    const category = categoryRepository.create({
      id: v4(),
      name: 'Test Category',
      createdAt: new Date(),
    });

    // Create a test document
    const document = documentRepository.create({
      id: v4(),
      userId: userId,
      text: 'Test document content',
      createdAt: new Date(),
      user: em.getReference(User, userId),
    });
    await em.flush();

    const addDocumentRequest: AddDocumentToCategoryRequest = {
      documentId: document.id,
    };

    // Act
    const addResponse = await request(app.getHttpServer() as App)
      .post(`/categories/${category.id}/documents`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(addDocumentRequest);

    // Assert
    expect(addResponse.status).toBe(201);

    const responseBody = addResponse.body as AddDocumentToCategoryResponse;
    expect(responseBody.id).toBe(document.id);
    expect(responseBody.categoryId).toBe(category.id);

    // Verify the document was actually added to the category in the database
    const updatedDocument = await documentRepository.findOne({
      id: document.id,
    });
    expect(updatedDocument!.categoryId).toBe(category.id);
  });

  it('(POST /categories/:id/documents) should return error when document does not exist', async () => {
    // Arrange
    const { accessToken } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);

    // Create a test category
    const category = categoryRepository.create({
      id: v4(),
      name: 'Test Category',
      createdAt: new Date(),
    });
    await em.flush();

    const addDocumentRequest: AddDocumentToCategoryRequest = {
      documentId: v4(), // Non-existent document ID
    };

    // Act
    const addResponse = await request(app.getHttpServer() as App)
      .post(`/categories/${category.id}/documents`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(addDocumentRequest);

    // Assert
    expect(addResponse.status).toBe(404);
  });

  it('(DELETE /categories/:categoryId/documents/:documentId) should remove a document from a category', async () => {
    // Arrange
    const { accessToken, userId } = await setupUser();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const categoryRepository: EntityRepository<Category> =
      em.getRepository(Category);
    const documentRepository: EntityRepository<Document> =
      em.getRepository(Document);

    const category = categoryRepository.create({
      id: v4(),
      name: 'Test Category',
      createdAt: new Date(),
    });

    const document = documentRepository.create({
      id: v4(),
      userId: userId,
      text: 'Test document content',
      createdAt: new Date(),
      categoryId: category.id,
      category: em.getReference(Category, category.id),
      user: em.getReference(User, userId),
    });
    await em.flush();

    // Act
    const removeResponse = await request(app.getHttpServer() as App)
      .delete(`/categories/${category.id}/documents/${document.id}`)
      .set('Authorization', `Bearer ${accessToken}`);

    // Assert
    expect(removeResponse.status).toBe(200);

    // Verify the document was actually removed from the category in the database
    const updatedDocument = await categoryRepository.findOne(
      {
        id: category.id,
      },
      { populate: ['documents'] },
    );
    expect(updatedDocument!.documents).toHaveLength(0);
  });
});
