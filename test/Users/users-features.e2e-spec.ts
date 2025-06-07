import { EntityRepository } from '@mikro-orm/core';
import { MikroORM } from '@mikro-orm/postgresql';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { RegisterUserRequest } from '../../src/users/features/register';
import { User } from '../../src/users/user.entity';

describe('User features tests', () => {
  let app: INestApplication;
  let postgresTestContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgresTestContainer = await new PostgreSqlContainer('postgres')
      .withExposedPorts(5432)
      .withDatabase('nest')
      .withUsername('root')
      .withPassword('secret')
      .start();

    process.env.DB_HOST = postgresTestContainer.getHost();
    process.env.DB_PORT = postgresTestContainer.getMappedPort(5432).toString();
    process.env.DB_NAME = 'nest';
    process.env.DB_USER = 'root';
    process.env.DB_PASSWORD = 'secret';

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const userRepository: EntityRepository<User> = em.getRepository(User);
    await userRepository.nativeDelete({});
  });

  afterAll(async () => {
    await app.close();
    await postgresTestContainer.stop();
  });

  it('(POST /register) should register a new user', async () => {
    const registerUserRequest = new RegisterUserRequest();
    registerUserRequest.username = 'testuser';
    registerUserRequest.password = 'testpassword';
    registerUserRequest.email = 'testEmail2@t.com';

    const response = await request(app.getHttpServer() as App)
      .post('/users/register')
      .send(registerUserRequest);

    expect(response.status).toBe(201);

    //get instance of orm and check if user is created
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const userRepository: EntityRepository<User> = em.getRepository(User);
    const createdUser = await userRepository.findOne({
      email: registerUserRequest.email,
    });

    expect(createdUser).toBeDefined();
    expect(createdUser!.email).toBe(registerUserRequest.email);
  });
});
