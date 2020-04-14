var redis = require('redis');

const isDev = process.env.NODE_ENV === 'dev';
const isProd = process.env.NODE_ENV === 'prod';

if(isDev || isProd) {
var redisClient = redis.createClient({
	port: 6379,
	host: 'redis',
});
} else {
  var redisClient = redis.createClient();
}

module.exports = redisClient;