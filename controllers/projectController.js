const { body,  validationResult } = require('express-validator');
const User = require('../models/User');
const Project = require('../models/Project');
const { contentSecurityPolicy } = require('helmet');
const Task = require('../models/Task');
const debug = require('../debug');

exports.getProjectsInProgress = async (req, res, next) => {
  try {
    const projects = await Project
    .find({$or: [{author: req.user._id}, {participants: req.user._id}], status: 'In progress'})
    .select('-participants -updatedAt')
    .populate('author', 'nickname profileImgUrl');
    res.status(200).json(projects);
  } catch(err) {
    next(err);
  }
};

exports.getProjectsAndPossibleAssigneesToCreateTask = async (req, res, next) => {
  try {
    const projects = await Project
      .find({$or: [{author: req.user._id}, {participants: req.user._id}], status: 'In progress'})
      .select('participants name author')
      .populate('participants', 'nickname profileImgUrl')
      .populate('author', 'nickname profileImgUrl');
    res.status(200).json(projects);
  } catch(err) {
    next(err);
  }
}

exports.getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project
    .find({$or: [{author: req.user._id}, {participants: req.user._id}]})
    .select('-participants -updatedAt')
    .populate('author', '-password -email');
    res.status(200).json(projects);
  } catch(err) {
    next(err);
  }
};

exports.getProjectInfo = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).populate('author', 'nickname profileImgUrl').populate('participants', 'nickname profileImgUrl');
    if (!project) {
      return res.sendStatus(404)
    };
    if ((project.author._id.equals(req.user._id))||(project.participants.some(user=>user._id.equals(req.user._id)))) {
      const tasks = await Task.find({project: project._id}).sort('dueDate').populate('assignee', 'nickname profileImgUrl');
      res.status(200).json({project, tasks});
    } else {
      res.sendStatus(403);
    }
  } catch(err) {
    next(err);
  }
}

exports.getUsersToInvite = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId).lean();
    if (!project) {
      return res.sendStatus(404)
    };
    const participants = project['participants'];
    const author = project['author'];
    const notParticipants = await User
      .find(
        {_id: {$nin: [...participants, author]}},
        'nickname profileImgUrl'
      )
      .lean();
    res.status(200).json(notParticipants);
  } catch(err) {
    next(err);
  }
}

exports.createProject = [
  (req, res, next) => {
    if (!Array.isArray(req.body.participants)) {
      req.body.participants =
        typeof req.body.participants === "undefined" ? [] : [req.body.participants];
    }
    next();
  },
  body('name')
    .isLength({min: 1})
    .withMessage('project name must be specified')
    .isLength({max: 100}),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
      };
      const { name, participants, deadline, link } = req.body;
      const newProject = new Project({name, author: req.user._id, participants, deadline, link});
      const projectInfo = await newProject.save();
      res.status(200).json(projectInfo);
    } catch(err) {
      next(err);
    }
  }
];

exports.inviteToProject = [
  (req, res, next) => {
    if (!req.body.participants) {
      return res.status(400).json({message: 'no participants to invite'});
    }
    if (!Array.isArray(req.body.participants)) {
      req.body.participants = [req.body.participants];
    }
    next();
  },
  async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.sendStatus(404)
    };
    if (project.author.equals(req.user._id)) {
      project.participants = [...new Set([...project.participants, ...req.body.participants])];
      const updatedProject = await project.save();
      res.status(200).json({participants: updatedProject.participants});
    } else {
      res.sendStatus(403);
    }
  } catch(err) {
    next(err);
  }
}];

exports.updateProject =[
  body('name')
    .isLength({min: 1})
    .withMessage('project name must be specified')
    .isLength({max: 100})
    .withMessage('project name mustn\'t exceed 100'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({'errors': errors.array()});
      }
      const project = await Project.findById(req.params.projectId);
      if (!project) {
        return res.sendStatus(404)
      };
      if (project.author.equals(req.user._id)) {
        const { name, status, link, deadline } = req.body;
        project.name = name;
        project.link = link; //if it's undefined mongoose performs $unset operation
        project.status = status?status:project.status;
        const updatedProject = await project.save();
        res.status(200).json(updatedProject);
      } else {
        res.sendStatus(403);
      }
    } catch(err) {
      next(err);
    }
  }
];

exports.leaveProject = async (req, res, next) => {
  try {
    const project = await Project.findByIdAndUpdate(req.params.projectId, {$pull: {'participants': req.user._id}}, {new: true});
    res.status(200).json({project});
  } catch(err) {
    next(err);
  }
};

exports.deleteProject = async(req, res, next) => {
  try {
    let projectId = req.params.projectId;
    const checkingProject = await Project.findById(projectId);
    if (!checkingProject) {
      return res.sendStatus(404)
    };
    if (checkingProject.author.equals(req.user._id)){
      await Project.findByIdAndDelete(projectId);
      await Task.deleteMany({project: projectId});
      res.sendStatus(200);
    } else {
      res.sendStatus(403);
    }
  } catch(err) {
    next(err);
  }
};