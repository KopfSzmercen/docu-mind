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
import { GetMeResponse } from 'src/users/features/get-me';
import { MikroOrmModule } from '@mikro-orm/nestjs';

describe('User features tests', () => {
  let app: INestApplication;
  let postgresTestContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    postgresTestContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withExposedPorts(5432)
      .withDatabase('nest')
      .withUsername('root')
      .withPassword('secret')
      .withStartupTimeout(120_000)
      .start();

    await new Promise((resolve) => setTimeout(resolve, 3000));

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(MikroOrmModule)
      .useModule(
        MikroOrmModule.forRoot({
          dbName: postgresTestContainer.getDatabase(),
          port: postgresTestContainer.getMappedPort(5432),
          host: postgresTestContainer.getHost(),
          user: postgresTestContainer.getUsername(),
          password: postgresTestContainer.getPassword(),
        }),
      )
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();

    const userRepository: EntityRepository<User> = em.getRepository(User);
    await userRepository.nativeDelete({});
  }, 120_000);

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

  it("(GET /me) should return the user's profile", async () => {
    const orm: MikroORM = app.get(MikroORM);
    const em = orm.em.fork();
    const userRepository: EntityRepository<User> = em.getRepository(User);

    const plainPassword = 'testpassword';
    const user = userRepository.create({
      fullName: 'testuser',
      email: 'test@t.com',
      password: await bcrypt.hash(plainPassword, 10),
      id: v4(),
    });
    await em.persistAndFlush(user);

    // Sign in to get the token
    const signInResponse = await request(app.getHttpServer() as App)
      .post('/users/sign-in')
      .send({
        email: user.email,
        password: plainPassword,
      });

    expect(signInResponse.status).toBe(201);
    const signInBody = signInResponse.body as SignInUserResponse;
    expect(signInBody.accessToken).toBeDefined();

    // Request the /me endpoint
    const meResponse = await request(app.getHttpServer() as App)
      .get('/users/me')
      .set('Authorization', `Bearer ${signInBody.accessToken}`);

    const responseBody = meResponse.body as GetMeResponse;
    expect(meResponse.status).toBe(200);
    expect(responseBody.id).toBe(user.id);
    expect(responseBody.email).toBe(user.email);
    expect(responseBody.fullName).toBe(user.fullName);
  });
});
