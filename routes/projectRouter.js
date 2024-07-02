const express = require('express');
const { getAllProjects, createProject, inviteToProject, updateProject, leaveProject, deleteProject, getProjectsInProgress, getProjectInfo, getUsersToInvite, getProjectsAndPossibleAssigneesToCreateTask } = require('../controllers/projectController');
const { accessTokenAuth } = require('../middlewares/authentication');
const { createTask } = require('../controllers/taskController');
const { isValidParams } = require('../middlewares/isValidParams');

const router = express.Router();

router.use(accessTokenAuth);

router.get('/', getProjectsInProgress);
router.get('/all', getAllProjects);
router.get('/assignees', getProjectsAndPossibleAssigneesToCreateTask);
router.post('/create', createProject);

router.use('/:projectId', isValidParams);

router.get('/:projectId', getProjectInfo);
router.get('/:projectId/users-to-invite', getUsersToInvite);
router.post('/:projectId/invite', inviteToProject);
router.post('/:projectId/update', updateProject);
router.post('/:projectId/leave', leaveProject);
router.post('/:projectId/delete', deleteProject);
router.post('/:projectId/create-task', createTask);

module.exports = router;