var express = require('express');
var router = express.Router();
require('../models/connection'); // lancement de la connexion avec la DB

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

module.exports = router;
