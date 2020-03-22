const MAX_PLAYERS = 10;

export class Room {
  constructor(id) {
    this.id = id;
    this.players = [];
  }

  addPlayer(player) {
    if (this.players.length >= MAX_PLAYERS) {
      return false;
    }
    this.players.push(player);
    this.broadcast('status', this.getStatus());
    return true;
  }

  removePlayer(player) {
    let index = this.players.indexOf(player);
    if (index >= 0) {
      this.players.splice(index, 1);
    }
    this.broadcast('status', this.getStatus());
  }

  broadcast(type, payload) {
    this.players.forEach(player => {
      player.sendMessage(type, payload);
    });
  }

  getStatus() {
    return this.players.map(player => player.name);
  }
}
