require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

// Import des routes
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const photoRouter = require('./routes/photo')
const deptRouter = require('./routes/departments')

const app = express();
const fileUpload = require("express-fileupload")
app.use(fileUpload())

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/photo', photoRouter);
app.use('/depts', deptRouter);

// Gestion d'erreurs simples
app.use(function (req, res) {
  res.status(404).json({ result: false, error: 'API route not found' });
});

module.exports = app;
