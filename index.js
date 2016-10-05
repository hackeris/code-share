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

var codeStore = {
  stores: {},
  codes: {},
  allocateId: function () {
    function make4Rand() {
      var result = "";
      for (var i = 0; i < 4; i++) {
        result += parseInt(Math.random() * 10);
      }
      return result;
    }

    var tries = 0;
    do {
      var rand = make4Rand();
      tries++;
    } while (this.stores[rand] && tries < 10);
    return rand;
  },
  getClients: function (id) {
    return this.stores[id];
  },
  addClient: function (id, client) {
    if (!this.stores[id]) {
      this.stores[id] = [];
      this.codes [id] = "";
    }
    this.stores[id].push(client);
  },
  removeClient: function (id, client) {

    function findIndex(arr, item) {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i] === item) {
          return i;
        }
      }
      return -1;
    }

    if (this.stores[id]) {
      var idx = findIndex(this.stores[id], client);
      this.stores[id].splice(idx, 1);
    }
    if (this.stores[id] && this.stores[id].length == 0) {
      delete this.stores[id];
      this.codes[id] = "";
    }
  },
  broadcastCode: function (client, code) {
    var clients = this.getClients(client.group);
    this.codes[client.group] = code;
    for (var i = 0; i < clients.length; i++) {
      if (clients[i].id != client.id) {
        clients[i].emit("code", code);
      }
    }
  },
  getCode: function (id) {
    return this.codes[id];
  }
};

app.get('/', function (req, res) {
  res.render('home.html');
});

app.get('/new', function (req, res) {
  var id = codeStore.allocateId();
  res.redirect('/code/' + id);
});

app.get('/code/:id', function (req, res) {
  var id = req.params.id;
  res.render('view', {
    group: id,
    code: codeStore.getCode(id)
  });
});

io.on('connection', function (client) {
  client.id = uuid.v4();
  client.on('code', function (code) {
    codeStore.broadcastCode(client, code);
    client.emit('sent');
  });
  client.on('join', function (id) {
    client.group = id;
    codeStore.addClient(id, client);
  });
  client.on('disconnect', function () {
    codeStore.removeClient(client.group, client);
  });
});

server.listen(config.PORT);
