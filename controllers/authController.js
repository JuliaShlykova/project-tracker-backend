const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { generateTokens, generateAccessToken, refreshTokenOptsHTTPOnly, refreshTokenOptsNotHTTP } = require('../utils/tokens');
const User = require('../models/User');
const debug = require('../debug');

exports.login = [
  body('email')
  .trim()
  .isLength({min:1})
  .withMessage('email must be specified')
  .isEmail()
  .withMessage('email must be valid')
  .isLength({max: 254})
  .withMessage('email mustn\'t exceed 254 characters'),  
  body('password')
  .trim()
  .isLength({min: 8})
  .withMessage('password must be at least 8 characters'),
  async (req, res, next) => {
    try {
      debug.info(req.body)
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        debug.error(errors.array());
        return res.status(422).json({'errors': errors.array()});
      }
      const {email, password} = req.body;
      const user = await User.findOne({email});
      if (!user) {
        debug.error('invalid email');
        return res.status(401).json({ errors: [{msg: "Invalid email or password"}] });
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        debug.error('invalid password');
        return res.status(401).json({ errors: [{msg: "Invalid email or password"}] });
      }
      const {accessToken, refreshTokenHP, refreshTokenS} = generateTokens({_id: user._id, nickname: user.nickname});
      res
        .cookie('refresh_token_hp', refreshTokenHP, refreshTokenOptsHTTPOnly)
        .cookie('refresh_token_s', refreshTokenS, refreshTokenOptsNotHTTP)
        .status(200)
        .json({token: accessToken, nickname: user.nickname, _id: user._id, profileImgUrl: user.profileImgUrl});
    } catch(err) {
      next(err);
    }
  }
];

exports.signup = [
  body('nickname')
  .trim()
  .isAlphanumeric('en-US', {ignore: /\s|_|-/g})
  .withMessage('nickname must consist of "-", "_" and alphanumeric english characters')
  .isLength({min: 1})
  .withMessage('nickname must be specified')
  .isLength({max: 40})
  .withMessage('nickname mustn\'t exceed 40 characters'),
  body('email')
  .trim()
  .isLength({min: 1})
  .withMessage('email must be specified')
  .isEmail()
  .withMessage('email must be valid')
  .isLength({max: 254})
  .withMessage('email mustn\'t exceed 254 characters'),  
  body('password')
  .trim()
  .isLength({min: 8})
  .withMessage('password must be at least 8 characters'),
  body('confirm_password')
  .trim()
  .custom((value, {req}) => {
    if (value!==req.body.password) {
      throw new Error('Passwords must be the same');
    }
    return true;
  }),
  async (req, res, next) => {
    try {
      const { email, password, nickname } = req.body;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({'errors': errors.array()});
      }
      const existingEmail = await User.findOne({email});
      if (existingEmail) {
        return res.status(409).json({"errors": [{ msg: 'The email is already in the database. Please, login.' }]})
      }
      const existingNickname = await User.findOne({nickname});
      if (existingNickname) {
        return res.status(409).json({"errors": [{ msg: 'The nickname is already in the database. Please, create another.' }]})
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, nickname, password: hashedPassword });
      await newUser.save();

      const {accessToken, refreshTokenHP, refreshTokenS}  = generateTokens({_id: newUser._id, nickname: newUser.nickname});
      res
        .cookie('refresh_token_hp', refreshTokenHP, refreshTokenOptsHTTPOnly)
        .cookie('refresh_token_s', refreshTokenS, refreshTokenOptsNotHTTP)
        .status(200)
        .json({token: accessToken, nickname: newUser.nickname, _id: newUser._id});
    } catch(err) {
      next(err);
    }
  }
];

exports.refresh = async (req, res, next) => {
  try {
    const token = generateAccessToken(req.user);
    res.status(200).json({token});
  } catch(err) {
    next(err);
  }
};

exports.logout = (req, res) => {
  if (req.cookies["refresh_token"]) {
    return  res.clearCookie("refresh_token", refreshTokenOptsHTTPOnly).status(200).json({ message: "Logout successful" });
  }
  return res.sendStatus(200);
};