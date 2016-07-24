"use strict";

var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render("join");
});

router.get("/:key", function(req, res, next) {
  res.render("versus");
});

module.exports = router;
