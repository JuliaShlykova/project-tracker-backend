const newUser = {
  email: 'test@test.com',
  password: 'password',
  confirm_password: 'password',
  nickname: 'test'
};

const anotherUser = {
  email: 'test2@test.com',
  password: 'password',
  confirm_password: 'password',
  nickname: 'test2'
}

const thirdUser = {
  email: 'test3@test.com',
  password: 'password',
  confirm_password: 'password',
  nickname: 'test3'
}

const newProject = {
  name: 'new Project'
};

const newTask = {
  name: 'new Task',
  taskType: 'Issue',
  dueDate: '2024-05-17T16:31'
};

const createMockedProjects = (quantity) => {
  let arr = [];
  for (let i=1; i<=quantity; i++) {
    arr.push({name: `project${i}`});
  }
  return arr;
};

module.exports = {
  newUser,
  anotherUser,
  thirdUser,
  newProject,
  newTask,
  createMockedProjects
};