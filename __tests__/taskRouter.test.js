const request = require('supertest');
const app = require('../app.js');
const { initializeMongoServer, dropDB, dropCollections } = require("./db.config.js");
const { newUser, newProject, createMockedProjects, anotherUser, thirdUser, newTask } = require('./data.js');

let token = '',
  anotherUserId = '',
  anotherUserToken = '',
  thirdUserId = '',
  taskId = '',
  projectId = '';

beforeAll(async () => {
  await initializeMongoServer();
});
 
afterAll(async () => {
  await dropDB();
});

describe('POST /tasks/:taskId/update', () => {
  beforeAll(async() => {
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
    const taskInfo = await request(app).post('/projects/' + projectId + '/create-task').auth(token, { type: 'bearer' }).send(newTask);
    taskId = taskInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and valid updated properties', async () => {
    const response = await request(app)
      .post('/tasks/'+taskId+'/update')
      .auth(token, { type: 'bearer' })
      .send({...newTask, done: true});
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.done).toBeTruthy();
    expect(response.body._id).toBe(taskId);
    const d = new Date().setMinutes(0,0,0);
    const completedDate = new Date(response.body.completedDate).setMinutes(0,0,0);
    expect(completedDate).toBe(d);
  })
});

describe("GET /tasks", () => {
  beforeAll(async() => {
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
    const taskInfo = await request(app).post('/projects/' + projectId + '/create-task').auth(token, { type: 'bearer' }).send(newTask);
    taskId = taskInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and valid name', async () => {
    const response = await request(app)
      .get('/tasks')
      .auth(token, { type: 'bearer' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body[0].name).toBe(newTask.name);
  });

  test('doesn\'t  return done tasks', async () => {
    await request(app)
      .post('/tasks/'+taskId+'/update')
      .auth(token, { type: 'bearer' })
      .send({...newTask, done: true});
    const response = await request(app)
      .get('/tasks')
      .auth(token, { type: 'bearer' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.length).toBe(0);
  });
});

describe("GET /tasks/all", () => {
  beforeAll(async() => {
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
    const taskInfo = await request(app).post('/projects/' + projectId + '/create-task').auth(token, { type: 'bearer' }).send(newTask);
    taskId = taskInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and valid name', async () => {
    const response = await request(app)
      .get('/tasks/all')
      .auth(token, { type: 'bearer' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body[0].name).toBe(newTask.name);
  });

  test('returns done tasks', async () => {
    await request(app)
      .post('/tasks/'+taskId+'/update')
      .auth(token, { type: 'bearer' })
      .send({...newTask, done: true});
    const response = await request(app)
      .get('/tasks/all')
      .auth(token, { type: 'bearer' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.length).toBe(1);
  });
});

describe('POST /tasks/:taskId/delete', () => {
  beforeAll(async() => {
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
    const taskInfo = await request(app).post('/projects/' + projectId + '/create-task').auth(token, { type: 'bearer' }).send(newTask);
    taskId = taskInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('removes task', async () => {
    let response = await request(app)
      .post('/tasks/'+taskId+'/delete')
      .auth(token, { type: 'bearer' });
    expect(response.statusCode).toBe(200);
    response = await request(app)
      .get('/tasks')
      .auth(token, {type: 'bearer'})
    expect(response.body.length).toBe(0);
  })
});
