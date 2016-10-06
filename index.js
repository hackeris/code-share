/**
 * Created by hackeris on 16/10/3.
 */

var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');
var session = require('express-session');
var uuid = require('uuid');

var config = require('./config/config.json');

var app = express();

var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.use(logger('dev'));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);
app.use('/public', express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

var CodeStore = require('./codestore');
var codeStore = new CodeStore();

app.get('/', function (req, res) {
  res.render('home.html');
});

app.get('/new', function (req, res) {
  var room = codeStore.allocateRoomId();
  res.redirect('/code/' + room);
});

app.get('/code/:room', function (req, res) {
  var room = req.params.room;
  if (codeStore.isActive(room)) {
    res.render('view', {
      group: room,
      code: codeStore.getCode(room)
    });
  } else {
    res.send('<h1>This room has been closed.</h1>');
  }
});

var codeRoom = io.of('/code-room');
codeRoom.on('connection', function (client) {
  client.on('join', function (id) {
    client.room = id;
    codeStore.joinRoom(client.room);
    client.join(id);
  });
  client.on('code', function (code) {
    codeStore.setCode(client.room, code);
    client.to(client.room).emit('code', code);
    client.emit('sent');
  });
  client.on('disconnect', function () {
    client.leave(client.room);
    codeStore.leaveRoom(client.room);
  });
});

server.listen(config.PORT);
