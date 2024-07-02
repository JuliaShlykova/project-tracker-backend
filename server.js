
const mongoose = require('mongoose');
const debug = require("debug")("app");

const app = require("./app");

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    debug('MongoDb Connected');
    app.listen(PORT);
    debug('server is listening on port ' + PORT);
  })
  .catch(err => {
    debug(err);
  })