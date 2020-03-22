export class Client {
  constructor(socket, server) {
    this.player = null;
    this.socket = socket;
    this.server = server;

    this.socket.on('message', message => this.handleMessage(message));
  }

  handleMessage(message) {
    try {
      message = JSON.parse(message);
    } catch(error) {
      this.sendError('Cannot decode JSON in received message.');
      return;
    }
    console.log('Receive', message.type, message.payload);
    if (this.player) {
      this.player.handleMessage(message.type, message.payload);
    } else {
      if (message.type === "register") {
        this.register(message.payload);
      } else {
        this.sendError('Must register first.');
      }
    }
  }

  register(payload) {
    if (payload && typeof(payload) !== 'string') {
      this.sendError('Invalid id.');
      return;
    }
    const player = this.server.registerPlayer(this, payload);
    if (player) {
      this.player = player;
      this.sendMessage('registered', player.id);
    }
  }

  sendMessage(type, payload) {
    const message = {
      type: type,
      payload: payload,
    }
    console.log('Send', type, payload);
    this.socket.send(JSON.stringify(message));
  }

  sendError(message) {
    console.error(message);
    this.socket.send(JSON.stringify({
      type: 'error',
      payload: message,
    }));
  }
}
