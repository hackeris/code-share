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

var RoomStore = require('./roomstore');
var roomStore = new RoomStore();

app.get('/', function (req, res) {
  res.render('home.html');
});

app.get('/new', function (req, res) {
  var room = roomStore.allocateRoomId();
  res.redirect('/view/' + room);
});

app.get('/code/:room', function (req, res) {
  var room = req.params.room;
  res.send({
    code: roomStore.getCode(room)
  });
});

app.get('/message/:room', function (req, res) {
  var room = req.params.room;
  res.send(roomStore.getMessages(room));
});

app.get('/view/:room', function (req, res) {
  var room = req.params.room;
  if (roomStore.isActive(room)) {
    res.render('room', {
      room: room,
      code: roomStore.getCode(room)
    });
  } else {
    res.send('<h1>This room has been closed.</h1>');
  }
});

var codeRoom = io.of('/code-room');
codeRoom.on('connection', function (client) {
  client.id = uuid.v4();
  client.emit('id', client.id);
  client.on('join', function (room) {
    client.room = room;
    client.join(room);
    roomStore.joinRoom(client.room);
  });
  client.on('code', function (code) {
    roomStore.setCode(client.room, code);
    client.to(client.room).emit('code', code);
    client.emit('code sent');
  });
  client.on('message', function (message) {
    roomStore.putMessage(client.id, client.room, message);
    client.to(client.room).emit('message',
      JSON.stringify({uid: client.id, message: message}));
    client.emit('message sent');
  });
  client.on('disconnect', function () {
    client.leave(client.room);
    roomStore.leaveRoom(client.room);
  });
});

server.listen(config.PORT);
