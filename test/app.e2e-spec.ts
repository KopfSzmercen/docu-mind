import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Module } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PersistnceModule } from '../src/infrastructure/persistence/persistence.module';
import { UsersModule } from '../src/users/users.module';
import { DocumentsModule } from 'src/documents/documents.module';

@Module({
  imports: [],
  controllers: [],
  providers: [],
})
class MockModule {}

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(PersistnceModule)
      .useModule(MockModule)
      .overrideModule(UsersModule)
      .useModule(MockModule)
      .overrideModule(DocumentsModule)
      .useModule(MockModule)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
