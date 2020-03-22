import { v4 as uuidv4 } from 'uuid';
import { Client } from './client';
import { Room } from './room';
import { Player } from './player';

const WebSocket = require('ws');
const WS_PORT = 8090;


class Server {
  constructor() {
    this.rooms = {};
    this.players = {};
    this.unregisteredClients = [];
    this.initWSServer();
  }

  initWSServer() {
    const wss = new WebSocket.Server({port: WS_PORT}, () => {
      console.log('WS server listening on port %s', WS_PORT);
    });

    wss.on('connection', socket => {
      const client = new Client(socket, this);
      this.unregisteredClients.push(client);
    });
  }

  registerPlayer(client, id) {
    const index = this.unregisteredClients.indexOf(client);
    if (index < 0) {
      console.error('Client not found in unregistered list.');
      return null;
    }
    this.unregisteredClients.splice(index, 1);

    if (!id) {
      id = uuidv4();
    }
    let player = this.players[id];
    if (!player) {
      player = new Player(id, client, this);
      this.players[id] = player;
    } else {
      const previous = player.client;
      previous.player = null;
      previous.socket.close();
      player.client = client;
    }
    return player;
  }

  getRoom(id) {
      if (!this.rooms[id]) {
          this.rooms[id] = new Room(id);
      }
      return this.rooms[id];
  }
}

new Server();
