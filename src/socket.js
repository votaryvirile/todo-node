var io = require('./index.js');

const sockets = (socket) => {
  socket.on('connect', function(){
		io.emit('connect');
  });

  socket.on('disconnect', function(){
		io.emit('disconnect');
	})

  socket.on('get_task', function(payload){
		io.emit('received_task', payload);
  });
};

module.exports = sockets;