const request = require('supertest');
const app = require('../app.js');
const { initializeMongoServer, dropDB, dropCollections } = require("./db.config.js");
const { newUser, newProject, createMockedProjects, anotherUser, thirdUser, newTask } = require('./data.js');

let token = '',
  anotherUserId = '',
  anotherUserToken = '',
  thirdUserId = '',
  projectId = '';

beforeAll(async () => {
  await initializeMongoServer();
});
 
afterAll(async () => {
  await dropDB();
});


describe("POST /projects/create", () => {
  beforeAll(async() => {
    const rs = await request(app).post('/auth/signup').send(anotherUser);
    anotherUserId = rs.body._id;
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and valid name', async () => {
    // response is http.serverResponse instance https://nodejs.org/api/http.html#responsestatuscode
    const response = await request(app)
      .post('/projects/create')
      .auth(token, { type: 'bearer' })
      .send(newProject);
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe('new Project');
  });

  test('fails without token', async () =>{
    const response = await request(app)
      .post('/projects/create')
      .send(newProject);
    expect(response.statusCode).toBe(401);
  });

  test('adds participants', async () => {
    const response = await request(app)
      .post('/projects/create')
      .auth(token, { type: 'bearer' })
      .send({...newProject, participants: anotherUserId});
    expect(response.statusCode).toBe(200);
    expect(response.body.participants[0]).toBe(anotherUserId);
  })
})

describe("GET /projects", () => {
  beforeAll(async () => {
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    let projects = createMockedProjects(4);
    await Promise.all(projects.map(project=>{
      return request(app)
      .post('/projects/create')
      .auth(token, { type: 'bearer' })
      .send(project);
    }));
    const rs = await request(app).post('/auth/signup').send(anotherUser);
    anotherUserId = rs.body._id;
    anotherUserToken = rs.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send({...newProject, participants: anotherUserId});
    projectId = projectInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and an array length 4', async () => {
    const response = await request(app)
      .get('/projects')
      .auth(token, { type: 'bearer' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.length).toBe(5);
  });

  test('responds with projects where author is the user', async () => {
    const response = await request(app)
      .get('/projects')
      .auth(token, { type: 'bearer' });
    expect(response.body[0].author.nickname).toBe(newUser.nickname);
  });

  test('responds with projects where the user is participant', async () => {
    const response = await request(app)
      .get('/projects')
      .auth(anotherUserToken, { type: 'bearer' });
    expect(response.body.length).toBe(1);
    expect(response.body[0]._id).toBe(projectId);
  });

  test('fails without token', async () =>{
    const response = await request(app)
      .get('/projects');
    expect(response.statusCode).toBe(401);
  });

});

describe("POST /projects/:projectId/invite", () => {
  beforeAll(async() => {
    const rs = await request(app).post('/auth/signup').send(anotherUser);
    anotherUserId = rs.body._id;
    anotherUserToken = rs.body.token;
    const rs2 = await request(app).post('/auth/signup').send(thirdUser);
    thirdUserId = rs2.body._id;
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and valid participant', async () => {
    // response is http.serverResponse instance https://nodejs.org/api/http.html#responsestatuscode
    const response = await request(app)
      .post('/projects/' + projectId + '/invite')
      .auth(token, { type: 'bearer' })
      .send({participants: anotherUserId});
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.participants).toContain(anotherUserId);
  });

  test('responds with two participants when add another one', async () => {
    const response = await request(app)
      .post('/projects/' + projectId + '/invite')
      .auth(token, { type: 'bearer' })
      .send({participants: thirdUserId});
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    let arrayParticipants = [thirdUserId, anotherUserId];
    arrayParticipants.map(participant => expect(response.body.participants).toContain(participant));
  });

  test('fails when invalid participant user id', async () => {
    const response = await request(app)
      .post('/projects/' + projectId + '/invite')
      .auth(token, { type: 'bearer' })
      .send({participants: 'invalidId'});
    expect(response.statusCode).not.toBe(200);
  });

  test('fails when no participant included', async () => {
    const response = await request(app)
      .post('/projects/' + projectId + '/invite')
      .auth(token, { type: 'bearer' })
      .send({participants: ''});
    expect(response.statusCode).not.toBe(200);
  });

  test('rejects when the user is not an author', async () => {
    const response = await request(app)
      .post('/projects/' + projectId + '/invite')
      .auth(anotherUserToken, { type: 'bearer' })
      .send({participants: thirdUserId});
    expect(response.statusCode).toBe(403);
  });
});

describe("POST /projects/:projectId/update", () => {
  beforeAll(async() => {
    const rs = await request(app).post('/auth/signup').send(anotherUser);
    anotherUserId = rs.body._id;
    anotherUserToken = rs.body.token;
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and and new name', async () => {
    // response is http.serverResponse instance https://nodejs.org/api/http.html#responsestatuscode
    const response = await request(app)
      .post('/projects/' + projectId + '/update')
      .auth(token, { type: 'bearer' })
      .send({name: 'new name'});
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe('new name');
  });

  test('rejects when the user is not an author', async () => {
    const response = await request(app)
      .post('/projects/' + projectId + '/update')
      .auth(anotherUserToken, { type: 'bearer' })
      .send({name: 'new name'});
    expect(response.statusCode).toBe(403);
  });

  test('fails when invalid project status', async () => {
    const response = await request(app)
      .post('/projects/' + projectId + '/update')
      .auth(token, { type: 'bearer' })
      .send({name: 'new name', status: 'random'});
    expect(response.statusCode).not.toBe(200);
  });
});

describe("POST /projects/:projectId/create-task", () => {
  beforeAll(async() => {
    const rs = await request(app).post('/auth/signup').send(anotherUser);
    anotherUserId = rs.body._id;
    anotherUserToken = rs.body.token;
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and valid name', async () => {
    const response = await request(app)
      .post('/projects/' + projectId + '/create-task')
      .auth(token, { type: 'bearer' })
      .send(newTask);
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.name).toBe(newTask.name);
  });
});

describe("GET /projects/:projectId", () => {
  beforeAll(async() => {
    const rs = await request(app).post('/auth/signup').send(anotherUser);
    anotherUserId = rs.body._id;
    anotherUserToken = rs.body.token;
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
    await request(app)
      .post('/projects/' + projectId + '/create-task')
      .auth(token, { type: 'bearer' })
      .send(newTask);
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json, valid author and tasks with length 1', async () => {
    const response = await request(app)
      .get('/projects/' + projectId)
      .auth(token, { type: 'bearer' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body.project._id).toBe(projectId);
    expect(response.body.project.author.nickname).toBe(newUser.nickname);
    expect(response.body.tasks.length).toBe(1);
  });

  test('fails when user is neither author nor participant', async () => {
    const response = await request(app)
      .get('/projects/' + projectId)
      .auth(anotherUserToken, { type: 'bearer' });
    expect(response.statusCode).toBe(403);
  });

  test('returns 404 when project doesn\'t exist', async() => {
    const response = await request(app)
    .get('/projects/' + projectId + 'invalud')
    .auth(token, { type: 'bearer' });
    console.log(response);
    expect(response.statusCode).toBe(404);
  })
});

describe("GET /projects/:projectId/users-to-invite", () => {
  beforeAll(async() => {
    const rs = await request(app).post('/auth/signup').send(anotherUser);
    anotherUserId = rs.body._id;
    anotherUserToken = rs.body.token;
    const response  = await request(app).post('/auth/signup').send(newUser);
    token = response.body.token;
    const projectInfo = await request(app).post('/projects/create').auth(token, { type: 'bearer' }).send(newProject);
    projectId = projectInfo.body._id;
  });

  afterAll(async () => {
    await dropCollections();
  });

  test('responds with json and list of non-participants', async () => {
    const response = await request(app)
      .get('/projects/' + projectId + '/users-to-invite')
      .auth(token, {type: 'bearer'});
    expect(response.statusCode).toBe(200);
    expect(response.body[0]._id).toBe(anotherUserId);
  })
});