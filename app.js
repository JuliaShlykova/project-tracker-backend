if (process.env.NODE_ENV!=='production') {
  require('dotenv').config();
}
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const debug = require('./debug');

const projectRouter = require('./routes/projectRouter');
const userRouter = require('./routes/userRouter');
const authRouter = require('./routes/authRouter');
const taskRouter = require('./routes/taskRouter');

const passport = require('passport');
require('./configs/passport.config')(passport);

const app = express();

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}));

if (process.env.NODE_ENV!=='test') {
  app.use(morgan('tiny'));
  app.use(rateLimit({
    widnowMs: 1*60*1000,
    limit: 40
  }));
};


app.use(helmet());
app.use(compression());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(passport.initialize());

app.use('/auth', authRouter);
app.use('/users', userRouter);
app.use('/projects', projectRouter);
app.use('/tasks', taskRouter);

app.use((req, res, next) => {
  res.sendStatus(404);
});

app.use((err, req, res, next) => {
  let error = { message: err.message, status: err.status };

  if (req.app.get("env") === "development") error.stack = err.stack; //trace where an error has been occured
  
  debug.error(error);

  res.status(err.status || 500).json({ error });
});

module.exports = app;