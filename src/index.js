var express = require('express');
var apiRoutes = require('./routes');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var mongoose = require('mongoose');
var redis = require("redis");

var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

module.exports = io;

var dotenv = require('dotenv').config();
var sockets = require('./socket');

var isLocal = process.env.NODE_ENV === 'local';
var isDev = process.env.NODE_ENV === 'dev';
var isProd = process.env.NODE_ENV === 'prod';

app.use(bodyParser.json());
app.use(cookieParser());

app.use(bodyParser.urlencoded({
  extended: true
}));

if(isDev || isProd) {
mongoose.connect('mongodb://mongo:27017/todoApp?gssapiServiceName=mongodb', { useNewUrlParser: true, useUnifiedTopology: true, retryWrites: false });
}  else {
  mongoose.connect('mongodb://localhost:27017/todoApp?gssapiServiceName=mongodb', { useNewUrlParser: true, useUnifiedTopology: true, retryWrites: false });
}

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type,x-api-key, X-HTTP-Method-Override, Accept');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

var port = process.env.PORT || 4000;

io.on('connection', sockets);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.use('/api', apiRoutes);


// if(isLocal) {
//   let testRoutes = require('./tests/test-routes');
//   app.use('/test', testRoutes);
// }

http.listen(port, function () {
     console.log("Application started, running on port " + port);
});
