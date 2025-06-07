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
import * as bcrypt from 'bcrypt';
import { SignInUserResponse } from 'src/users/features/sign-in';
import { v4 } from 'uuid';

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
    process.env.JWT_SECRET =
      'testsecretkey123456789010111213141516171819202122232425262';

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

  afterEach(async () => {
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const userRepository: EntityRepository<User> = em.getRepository(User);
    await userRepository.nativeDelete({});
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

  it('(POST /sign-in) should sign in an existing user', async () => {
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const userRepository: EntityRepository<User> = em.getRepository(User);
    const user = userRepository.create({
      fullName: 'testuser',
      email: 'test@t.pl',
      password: await bcrypt.hash('testpassword', 10),
      id: v4(),
    });
    await em.flush();

    const signInResponse = await request(app.getHttpServer() as App)
      .post('/users/sign-in')
      .send({
        email: user.email,
        password: 'testpassword',
      });

    expect(signInResponse.status).toBe(201);

    const responseBody = signInResponse.body as SignInUserResponse;
    expect(responseBody.accessToken).toBeDefined();
  });
});
