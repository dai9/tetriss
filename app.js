"use strict";

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var solo = require('./routes/solo');
var versus = require('./routes/versus');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

function getOpponent(roomKey, socketId) {
  if (rooms[roomKey]) {
    if (rooms[roomKey][0] === socketId) {
      return rooms[roomKey][1];
    } else {
      return rooms[roomKey][0];
    }
  }
}

let rooms = {};
let players = {};
io.on('connection', function(socket) {
  players[socket.id] = false;
  let gKey;
  socket.on("joined-room", function(key) {
    gKey = key;
    if (!rooms[key]) rooms[key] = [];
    if (rooms[key].length >= 2) {
      socket.emit("full-room");
      return;
    }
    rooms[key].push(socket.id);
    socket.emit("joined-room");
    let opponent = getOpponent(gKey, socket.id);
    if (opponent) {
      io.to(opponent).emit("opponent-joined");
    }
    if (rooms[key].length === 2) {
      for (let i = 0; i < rooms[key].length; i++) {
        io.to(rooms[key][i]).emit("enough-players");
      }
    }
  });

  socket.on("matrix-data", function(grid) {
    let opponent = getOpponent(gKey, socket.id);
    if (opponent) {
      io.to(opponent).emit("matrix-data", grid);
    }
  });

  socket.on("send-lines", function(n) {
    let opponent = getOpponent(gKey, socket.id);
    if (opponent) {
      let rowsToSend = n < 4 ? --n : n;
      io.to(opponent).emit("send-lines", rowsToSend);
    }
  });

  socket.on("ready", function() {
    players[socket.id] = true;
    if (rooms[gKey].every((id) => { return players[id] === true })) {
      for (let i = 0; i < rooms[gKey].length; i++) {
        players[rooms[gKey][i]] = false;
        io.to(rooms[gKey][i]).emit("game-start");
      }
    }
  });

  socket.on("send-message", function(msg) {
    let opponent = getOpponent(gKey, socket.id);
    if (opponent) {
      io.to(opponent).emit("receive-message", msg);
    }
  });

  socket.on("cancel-ready", function() {
    players[socket.id] = false;
  });

  socket.on("game-over", function() {
    let opponent = getOpponent(gKey, socket.id);
    if (opponent) {
      io.to(opponent).emit("game-over");
    }
  });

  socket.on('disconnect', function() {
    delete players[socket.id];
    if (gKey) {
      let i = rooms[gKey].indexOf(socket.id);
      rooms[gKey].splice(i, 1);
      for (let i = 0; i < rooms[gKey].length; i++) {
        io.to(rooms[gKey][i]).emit("not-enough-players");
      }
    }
  });
});

app.use('/', routes);
app.use('/solo', solo);
app.use('/versus', versus);
app.get('/chat', function(req, res, next) {
  res.render('chat');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
