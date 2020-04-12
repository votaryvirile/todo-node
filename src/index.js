const express = require('express');
const apiRoutes = require('./routes');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const redis = require("redis");

const app = express();

// const server = require('http').createServer(express);

// const io = require('socket.io')(server);

const dotenv = require('dotenv').config();

const isLocal = process.env.NODE_ENV === 'local';
const isDev = process.env.NODE_ENV === 'dev';
const isProd = process.env.NODE_ENV === 'prod';

app.use(bodyParser.json());
app.use(cookieParser({
  domain: 'http:localhost:4000',
  path: '/'
}));

app.use(bodyParser.urlencoded({
  extended: true
}));

if(isDev || isProd) {
var redisClient = redis.createClient({
                port: 6379,
                host: 'redis',
              });
mongoose.connect('mongodb://mongo:27017/todoApp?gssapiServiceName=mongodb', { useNewUrlParser: true, useUnifiedTopology: true, retryWrites: false });
}  else {
  var redisClient = redis.createClient();
  mongoose.connect('mongodb://localhost:27017/todoApp?gssapiServiceName=mongodb', { useNewUrlParser: true, useUnifiedTopology: true, retryWrites: false });
}

redisClient.on("error", function (err) {
    console.log("Error", err);
    console.log("error on redis");
});
redisClient.on('ready', function() {
    console.log('redis is running');
});

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type,x-api-key, X-HTTP-Method-Override, Accept');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});

var port = process.env.PORT || 4000;

app.get('/', (req, res) => res.send('This is a TodoApp developed with Love by Vimal Radhakrishnan for Doodleblue'));
app.use('/api', apiRoutes);

// if(isLocal) {
//   let testRoutes = require('./tests/test-routes');
//   app.use('/test', testRoutes);
// }

app.listen(port, function () {
     console.log("Application started, running on port " + port);
});
