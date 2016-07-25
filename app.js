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

// app.use('/versus', function(req, res, next) {
//
//   next();
// });

let rooms = {};
io.on('connection', function(socket) {
  let gKey;
  socket.on("join-room", function(key) {
    gKey = key;
    if (!rooms[key]) rooms[key] = [];
    if (rooms[key].length >= 2) {
      socket.emit("full-room");
      return;
    }
    rooms[key].push(socket.id);
    if (rooms[key].length === 2) {
      io.emit("game-start");
    }
  });

  socket.on("matrix-data", function(grid) {
    let opponent = rooms[gKey].indexOf(socket.id) === 0 ? rooms[gKey][1] : rooms[gKey][0];
    io.to(opponent).emit("matrix-data", grid);
  });

  socket.on("send-lines", function(n) {
    let opponent = rooms[gKey].indexOf(socket.id) === 0 ? rooms[gKey][1] : rooms[gKey][0];
    let rowsToSend = n < 4 ? --n : n;
    io.to(opponent).emit("send-lines", rowsToSend);
  });

  socket.on("game-over", function() {
    let opponent = rooms[gKey].indexOf(socket.id) === 0 ? rooms[gKey][1] : rooms[gKey][0];
    io.to(opponent).emit("game-over");
  })

  socket.on('disconnect', function(){
    console.log('user disconnected');
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
