const { body, validationResult } = require('express-validator');
const {removeImg, uploadImg } = require('../utils/profileImg');
const multer = require('../configs/multer.config');
const User = require('../models/User');
const Project = require('../models/Project');
const debug = require('../debug');

exports.getPossibleParticipants = async (req, res, next) => {
  try {
    const participants = await User.find({_id: {$ne: req.user._id}}).select('nickname profileImgUrl').lean();
    res.status(200).json(participants);
  } catch(err) {
    next(err);
  }
};

exports.udpateNickname = [
  body('nickname')
  .trim()
  .isAlphanumeric('en-US', {ignore: /\s|_|-/g})
  .withMessage('nickname must consist of "-", "_" and alphanumeric english characters')
  .isLength({min: 1})
  .withMessage('user nickname must be specified')
  .isLength({max: 40})
  .withMessage('user nickname mustn\'t exceed 40'),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({'errors': errors.array()});
      }
      const { nickname } = req.body;
      const checkUsedNickname = await User.findOne({nickname: nickname});
      if (checkUsedNickname) {
        return res.status(422).json({'errors': [{msg: 'The nickname is already in the database. Please, create another.'}]})
      } 
      await User.findByIdAndUpdate(req.user._id, {nickname}, {new: true});
      res.sendStatus(200);
    } catch(err) {
      next(err);
    }
  }
];

exports.uploadUserImg = [
    multer.single('userImg'),
    body('userImg')
      .custom((value, { req }) => {
        if (
          req.file?.mimetype !== 'image/jpeg'
          && req.file?.mimetype !== 'image/png'
          && req.file?.mimetype !== 'image/webp'
        ) {
          return false
        }
        return true;
      })
      .withMessage('Upload only image formats'),
    async(req, res, next) => {
      if (!req.file) {
        return res.status(400).json({message: 'no file attached'});
      }
      const errors = validationResult(req);
      if(!errors.isEmpty()) {
        return res.status(422).json({errors: errors.array()});
      }
      try {
        const currentUser = await User.findById(req.user._id);
        let oldImgId = currentUser.profileImgId;
        if (oldImgId) {
          removeImg(oldImgId);
        }
        const fileResponse = await uploadImg(req.file);
        currentUser.profileImgId = fileResponse.fileId;
        currentUser.profileImgUrl = fileResponse.url;
        await currentUser.save();
        res.status(200).json({profileImgUrl: currentUser.profileImgUrl});
      } catch(err) {
        next(err);
      }
    }
];