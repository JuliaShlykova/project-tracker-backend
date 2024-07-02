const debug = require('debug');

const LOG_PREFIX = 'app';

const info = debug(`${LOG_PREFIX}:info`);
const result = debug(`${LOG_PREFIX}:result`);
const error = debug(`${LOG_PREFIX}:error`);

module.exports = {
  info,
  result,
  error
};