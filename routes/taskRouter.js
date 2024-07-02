const express = require('express');
const { getNotDoneTasks, getAllTasks, updateTask, deleteTask, getTaskInfo } = require('../controllers/taskController');
const { accessTokenAuth } = require('../middlewares/authentication');
const { isValidParams } = require('../middlewares/isValidParams');

const router = express.Router();

router.use(accessTokenAuth);


router.get('/', getNotDoneTasks);
router.get('/all', getAllTasks);

router.use('/:taskId', isValidParams);

router.get('/:taskId', getTaskInfo);
router.post('/:taskId/update', updateTask);
router.post('/:taskId/delete', deleteTask);

module.exports = router;