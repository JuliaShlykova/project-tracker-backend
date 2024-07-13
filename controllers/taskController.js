const { body,  validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const debug = require('../debug');

exports.getNotDoneTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({assignee: req.user._id, done: false}).sort('dueDate').populate('project', 'name');
    res.status(200).json(tasks);
  } catch(err) {
    next(err);
  }
};

exports.getAllTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({assignee: req.user._id}).sort('-dueDate').populate('project', 'name');
    res.status(200).json(tasks);
  } catch(err) {
    next(err);
  }
};

exports.createTask = [
  body('name')
    .isLength({min: 1})
    .withMessage('task name must be specified')
    .isLength({max: 100})
    .withMessage('task name mustn\'t exceed 100'),
  body('description')
    .isLength({max: 300})
    .withMessage('task description mustn\'t exceed 300 characters'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({'errors': errors.array()});
      }
      const projectId = req.params.projectId;
      const project = await Project.findById(projectId);
      if (project.author.equals(req.user._id)||project.participants.some(user=>user.equals(req.user._id))) {
        const { name, description, taskType, assignee, dueDate } = req.body;
        const newTask = new Task({ name, description, taskType, assignee: assignee?assignee:req.user._id, dueDate, project: projectId });
        const taskInfo = await newTask.save();
        res.status(200).json(taskInfo);
      } else {
        res.sendStatus(403);
      }
    } catch(err) {
      next(err);
    }
  }
];

exports.getTaskInfo = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const taskInfo = await Task.findById(taskId).populate('project', 'name').populate('assignee', 'nickname');
    if (!taskInfo) {
      return res.sendStatus(404)
    };
    const projectId = taskInfo.project._id;
    const project = await Project.findById(projectId);
    if (project.author.equals(req.user._id)||project.participants.some(user=>user.equals(req.user._id))) {
      res.status(200).json(taskInfo);
    } else {
      debug.error('no rights to see task');
      res.sendStatus(403);
    }
  } catch(err) {
    next(err);
  }
}

exports.updateTask = [
  body('name')
  .isLength({max: 100})
  .withMessage('task name mustn\'t exceed 100'),
body('description')
  .isLength({max: 300})
  .withMessage('task description mustn\'t exceed 300 characters'),
async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      debug.error(errors.array());
      return res.status(422).json({'errors': errors.array()});
    };
    const taskId = req.params.taskId;
    const oldTask = await Task.findById(taskId);
    if (!oldTask) {
      return res.sendStatus(404)
    };
    const projectId = oldTask.project;
    const project = await Project.findById(projectId);
    if (project.author.equals(req.user._id)||project.participants.some(user=>user.equals(req.user._id))) {
      const { name, description, dueDate, done } = req.body;
      const completedDate = done?((oldTask.done===done)?oldTask.completedDate:(new Date().toISOString())):undefined;
      const task = await Task.findByIdAndUpdate(taskId, { name, description, dueDate, done, completedDate }, {new: true} ).populate('project', 'name').populate('assignee', 'nickname');
      res.status(200).json(task);
    } else {
      debug.error('no rights to modify');
      res.sendStatus(403);
    }
  } catch(err) {
    next(err);
  }
}
];

exports.deleteTask = async (req, res, next) => {
  try {
    const taskId = req.params.taskId;
    const oldTask = await Task.findById(taskId);
    if (!oldTask) {
      return res.sendStatus(404)
    };
    const projectId = oldTask.project;
    const project = await Project.findById(projectId);
    if (project.author.equals(req.user._id)||project.participants.some(user=>user.equals(req.user._id))) {
      await Task.findByIdAndDelete(taskId);
      res.sendStatus(200);
    } else {
      res.sendStatus(403);
    }
  } catch(err) {
    next(err);
  }
};