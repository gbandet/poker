const WebSocket = require('ws');

const WS_PORT = 8090;

const wss = new WebSocket.Server({port: WS_PORT}, () => {
  console.log('WS server listening on port %s', WS_PORT);
});

wss.on('connection', function connection(ws) {
  var x = 0;
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    ws.send('Message ' + x++ + ' received');
  });

  ws.send('START');
});
