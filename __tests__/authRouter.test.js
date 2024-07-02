const request = require('supertest');
const app = require('../app.js');
const { initializeMongoServer, dropDB, dropCollections } = require("./db.config.js");
const { newUser } = require('./data.js');

beforeAll(async () => {
  await initializeMongoServer();
});
 
afterAll(async () => {
  await dropDB();
});

describe("POST /auth/signup", () => {
  afterAll(async () => {
    await dropCollections();
  });

  test('responds with token', async () => {
    // response is http.serverResponse instance https://nodejs.org/api/http.html#responsestatuscode
    const response = await request(app)
      .post('/auth/signup')
      .send(newUser);
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.token).toBeDefined();
  });

  test('fails and responds with error when invalid nickname', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({...newUser, email:'valid@test.com', nickname: '%$%*&<>'});
    expect(response.statusCode).not.toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  test('fails and responds with error when invalid email', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({...newUser, email:'invalid.mail'});
    expect(response.statusCode).not.toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  test('fails and responds with error when passwords don\'t match', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({...newUser, confirm_password: 'invalid'});
    expect(response.statusCode).not.toBe(200);
    expect(response.body.errors).toBeDefined();
  });

  test('allows nickname with spaces, underscores and hyphens', async () => {
    const response = await request(app)
      .post('/auth/signup')
      .send({...newUser, email:'valid@test.com', nickname: 'J1_ -y j'});
    expect(response.statusCode).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});

describe("POST /auth/login", () => {
  beforeAll(async() => {
    await request(app).post('/auth/signup').send(newUser);
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('fails when invalid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({email: 'invalid@test.com', password: 'invalidPassword'});
    expect(response.statusCode).toBe(401);
  });

  test('fails when invalid password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({email: newUser.email, password: 'invalidPassword'});
    expect(response.statusCode).toBe(401);
  });

  test('responds with token when valid credentials', async () => {
    const response = await request(app)
    .post('/auth/login')
    .send({ email: newUser.email, password: newUser.password});
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.token).toBeDefined();
  })
})