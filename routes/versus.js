"use strict";

var express = require('express');
var router = express.Router();
var app = require('../app');

router.get('/', function(req, res, next) {
  res.render("lobby");
});

router.get("/:key", function(req, res, next) {
  res.render("versus");
});

module.exports = router;
