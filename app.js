require('dotenv').config();
require('./models/connection');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const fileUpload = require('express-fileupload');

// Import des routes
const usersRouter = require('./routes/users');
const photoRouter = require('./routes/photo');
const deptRouter = require('./routes/departments');
const challengesRouter = require('./routes/challenges');

const app = express();

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/users', usersRouter);
app.use('/photo', photoRouter);
app.use('/depts', deptRouter);
app.use('/challenges', challengesRouter);

// 404 simple
app.use(function (req, res) {
  res.status(404).json({ result: false, error: 'API route not found' });
});

module.exports = app;