var io = require('socket.io-client');
var net = require('net');

var HOST = '127.0.0.1';
var PORT = 6969;

var receivedata;

function clientsocket() {
  var netserver = net.createServer();
  netserver.listen(PORT,HOST);
  console.log('Server listening on ');
  //   netserver.address().address+':'+netserver.address().port);

  netserver.on('connection', (client) => {
    console.log(client.remoteAddress+':'+client.remotePort);
    client.on('data', (data) => {
      receivedata = data.toString('utf-8');
      console.log('receivedata:'+receivedata);
      client.write('OK!');
      socket.emit('chat message', receivedata);
    });
  });

  netserver.on('disconnect',() => {
    console.log('Disconnect!');
  });

  netserver.on('close', () => {
    console.log('Connection closed');
  });

  netserver.on('error', (error) => {
    console.log('Error Connection:'+error);
  });


  var socket = io('http://localhost:3000');
  socket.on('connect', () => {
    console.log('socket connected');
  });
  
  socket.on('open', () => {
    console.log('data');
  });

  socket.on('disconnect', () => {
    console.log('disconnect client event....');
  });
}



clientsocket();
