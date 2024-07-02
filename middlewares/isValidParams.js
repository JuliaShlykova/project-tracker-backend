const ObjectId = require('mongoose').Types.ObjectId;
const debug = require('../debug');

exports.isValidParams = (req, res, next) => {
  for (let id of Object.values(req.params)) {
    if (!ObjectId.isValid(id)) {
      debug.error('invalid mongodb objectid');
      return res.sendStatus(404);
    }
  }
  next();
}