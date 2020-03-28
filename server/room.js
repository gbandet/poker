import { Game } from "./game";

export class Room {
  constructor(id) {
    this.id = id;
    this.game = new Game();
  }

  handleMessage(player, type, paylaod) {
    this.game.handleMessage(player, type, paylaod);
  }

  addPlayer(player) {
    return this.game.addPlayer(player);
  }

  reconnect(player) {
    this.game.reconnect(player);
  }
}
