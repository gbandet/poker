import { ClientError } from "./error";


export class Player {
  constructor(id, client, server) {
    this.id = id;
    this.client = client;
    this.server = server;
    this.name = null;
    this.room = null;
  }

  handleMessage(type, payload) {
    switch (type) {
      case 'join':
        this.handleJoin(payload);
        break;
      default:
        if (this.room) {
          try {
            this.room.handleMessage(this, type, payload);
          } catch (error) {
            if (error instanceof ClientError) {
              this.client.sendError(error.message);
            } else {
              throw error;
            }
          }
        } else {
          this.client.sendError(`Unknown message type: "${type}".`);
        }
    }
  }

  handleJoin(payload) {
    if (!payload.room) {
      this.client.sendError('Missing room id.');
      return;
    }
    if (!payload.name) {
      this.client.sendError('Missing name.');
      return;
    }
    if (this.room) {
      if (this.room.id !== payload.room) {
        this.client.sendError('Already in a room.');
      } else {
        this.room.reconnect(this);
      }
      return;
    }
    this.name = payload.name;
    let room = this.server.getRoom(payload.room);
    if (room.addPlayer(this)) {
      this.room = room;
      console.log(`Player ${this.id} (${this.name}) joined room ${this.room.id}`);
    } else {
      this.sendMessage('roomFull');
    }
  }

  sendMessage(type, payload) {
    this.client.sendMessage(type, payload);
  }
}
