var server = require('http').createServer();
var io = require('socket.io')(server);

var i = 1;

io.on('connection', (socket) => {
  console.log(i++);
  socket.emit('open');

  // console.log(socket.handshake);

  socket.on('disconnect', () => {
    console.log('user disconnected!');
  });

  socket.on('chat message', (msg) => {
    // j = JSON.parse(msg);
    console.log('message:'+msg);
  });
});


server.listen(3000);