import { ClientError, GameError } from './error';


const MAX_PLAYERS = 10;

export class Game {
  constructor() {
    this.seats = [];
    this.phase = GamePhase.Setup;
    this.turn = 0;
    this.minimumRaise = 0;
    this.bet = 0;
    this.better = null;
    this.pots = [];
    this.smallBlind = 0;
    this.bigBlind = 0;
    this.dealer = 0;
  }

  handleMessage(player, type, payload) {
    switch (type) {
      case 'start':
        this.startGame();
        break;
      case 'fold':
        this.doBet(player, -1);
        break;
      case 'bet':
        if (typeof(payload) !== 'number' || payload < 0) {
          throw new ClientError('Invalid value.');
        }
        this.doBet(player, payload);
        break;
      default:
        throw new ClientError(`Unknown message type: "${type}"`);
    }
  }

  addPlayer(player) {
    if (this.seats.length >= MAX_PLAYERS) {
      return false;
    }
    this.seats.push(new SeatedPlayer(player));
    this.broadcastStatus();
    return true;
  }

  reconnect(player) {
    const seat = this.findPlayerSeat(player);
    if (seat) {
      seat.player.sendMessage('status', this.getStatus(seat));
    }
  }

  findPlayerSeat(player) {
    for (let seat of this.seats) {
      if (seat.player === player) {
        return seat;
      }
    }
    return null;
  }

  broadcastStatus() {
    this.seats.forEach(seat => {
      seat.player.sendMessage('status', this.getStatus(seat));
    });
  }

  getStatus(seat) {
    return {
      dealer: this.dealer,
      phase: this.phase,
      turn: this.turn,
      bet: this.bet,
      minimumRaise: this.minimumRaise,
      pots: this.pots,
      smallBlind: this.smallBlind,
      bigBlind: this.bigBlind,
      seats: this.seats.map(seat => {
        let ret = Object.assign({}, seat);
        delete ret.player;
        ret.name = seat.player.name;
        return ret;
      }),
    }
  }

  startGame(player) {
    if (this.phase !== GamePhase.Setup) {
      throw new ClientError('Invalid phase.');
    }
    if (this.seats.length < 2) {
      throw new ClientError('Not enough players');
    }
    this.nextPhase();
    this.broadcastStatus();
  }

  doBet(player, value) {
    if (!this.phase in GamePhase.betPhases) {
      throw new ClientError('Invalid phase.');
    }
    const position = this.getPlayerPosition(player);
    if (position != this.turn) {
      throw new ClientError('Invalid turn.');
    }
    const seat = this.seats[position];
    if (value < 0) {
      this.handleFold(seat);
    } else {
      if (!this.checkValidBet(seat, value)) {
        throw new ClientError('Invalid bet ammout.');
      }
      this.handleBet(position, seat, value);
    }
    this.nextTurn();
  }

  nextTurn() {
    const active = this.seats.filter(seat => !seat.isFolded).length;
    if (active < 2) {
      this.finishUnshown();
      this.broadcastStatus();
      return;
    }

    this.turn = this.getNextTurnPosition(this.turn);
    if (this.turn === null) {
      const betting = this.seats.filter(seat => !seat.isFolded && seat.chips > 0).length;
      if (betting < 2) {
        // Skip to the end of the round if no more than one player can still bet.
        this.endBetPhase(GamePhase.RoundEnd);
        this.finishShown();
        this.broadcastStatus();
      } else {
        this.nextPhase();
      }
    } else {
      this.broadcastStatus();
    }
  }

  getNextPosition(start, skip, stop) {
    let current = start;
    let seat;
    do {
      if (++current >= this.seats.length) {
        current = 0;
      }
      seat = this.seats[current];
    } while (skip(seat) && current !== position && current !== stop);
    if (current === position || current === stop) {
      return null;
    }
    return current;
  }

  getNextTurnPosition(position) {
    return this.getNextPosition(position, seat => seat.isFolded || seat.chips <= 0, this.better);
  }

  getNextAlivePosition(position) {
    const next = this.getNextPosition(position, seat => seat.chips <= 0);
    if (next === null) {
      throw new GameError("No next player.");
    }
    return next;
  }

  nextPhase() {
    switch(this.phase) {
      case GamePhase.Setup:
        this.phase = GamePhase.RoundStart;
        this.setupGame();
        setTimeout(() => this.nextPhase(), 2000);
        break;
      case GamePhase.RoundStart:
        this.phase = GamePhase.Preflop;
        this.setupRound();
        break;
      case GamePhase.Preflop:
        this.endBetPhase(GamePhase.Flop);
        break;
      case GamePhase.Flop:
        this.endBetPhase(GamePhase.Turn);
        break;
      case GamePhase.Turn:
        this.endBetPhase(GamePhase.River);
        break;
      case GamePhase.River:
        this.endBetPhase(GamePhase.RoundEnd);
        this.finishShown();
        break;
      case GamePhase.RoundEnd:
        if (this.seats.filter(seat => seat.chips > 0).length > 1) {
          this.phase = GamePhase.RoundStart;
          setTimeout(() => this.nextPhase(), 2000);
        } else {
          this.phase = GamePhase.GameEnd;
        }
        break;
      default:
        throw new GameError(`Unhandled transition from "${this.phase}".`);
    }
    this.broadcastStatus();
  }

  setupGame() {
    this.smallBlind = 10;
    this.bigBlind = 20;
    this.dealer = this.seats.length - 1;
    this.seats.forEach(seat => seat.chips = 1000);
  }

  setupRound() {
    this.seats.forEach(seat => {
      seat.isFolded = seat.chips <= 0;
    })
    this.dealer = this.getNextAlivePosition(this.dealer);
    this.pots = [new Pot()];
    this.bet = 0;
    this.minimumRaise = this.bigBlind;
    this.better = null;
    this.setBlinds();
  }

  setBlinds() {
    let position = this.getNextAlivePosition(this.dealer);
    let seat = this.seats[position];
    seat.chips -= this.smallBlind;
    seat.bet += this.smallBlind;

    position = this.getNextAlivePosition(position);
    seat = this.seats[position];
    seat.chips -= this.bigBlind;
    seat.bet += this.bigBlind;

    this.turn = this.getNextAlivePosition(position);
  }

  endBetPhase(nextPhase) {
    const bets = this.seats.reduce((acc, seat) => {
      const bet = seat.bet;
      seat.bet = 0;
      return bet + acc;
    }, 0);
    const pot = this.pots[this.pots.length - 1];    // TODO handle side pots
    pot.value += bets;
    this.bet = 0;
    this.minimumRaise = this.bigBlind;
    this.better = null;
    this.turn = this.getNextTurnPosition(this.dealer);
    this.phase = nextPhase;
  }

  checkValidBet(seat, bet) {
    if (bet > seat.chips) {
      return false;
    }
    if (bet == seat.chips) {
      // All-in
      return true;
    }
    const total_bet = seat.bet + bet;
    if (total_bet < this.bet) {
      return false;
    }
    if (total_bet === this.bet) {
      // Check/Call
      return true;
    }
    const raise = total_bet - this.bet;
    if (raise < this.minimumRaise) {
      return false;
    }
    return true;
  }

  handleBet(position, seat, bet) {
    seat.chips -= bet;
    seat.bet += bet;
    if (this.better === null) {
      this.better = position;
    }
    if (seat.bet > this.bet) {
      this.minimumRaise = seat.bet - this.bet;
      this.bet = seat.bet;
      this.better = position;
    }
  }

  handleFold(seat) {
    seat.isFolded = true;
  }

  finishShown() {
    // TODO handle side pots and correct winner
    const winner = this.getNextTurnPosition(Math.floor(Math.random() * this.seats.length));
    this.payPot(this.pots[0], this.seats[winner]);
    setTimeout(() => this.nextPhase(), 5000);
  }

  finishUnshown() {
    this.endBetPhase(GamePhase.RoundEnd);
    const winner = this.getNextTurnPosition(0);
    this.payPot(this.pots[0], this.seats[winner]);
    setTimeout(() => this.nextPhase(), 5000);
  }

  payPot(pot, seat) {
    seat.chips += pot.value;
    pot.value = 0;
  }

  getPlayerPosition(player) {
    for (let i = 0; i < this.seats.length; i++) {
      const seat = this.seats[i];
      if (seat.player === player) {
        return i;
      }
    }
    throw new GameError('Player not found');
  }
}

export const GamePhase = {
  Setup: 'setup',
  RoundStart: 'roundStart',
  Preflop: 'preflop',
  Flop: 'flop',
  Turn: 'turn',
  River: 'river',
  RoundEnd: 'roundEnd',
  GameEnd: 'gameEnd',

  betPhases: ['preflop', 'flop', 'turn', 'river'],
}

class SeatedPlayer {
  constructor(player) {
    this.player = player;
    this.chips = 0;
    this.bet = 0;
    this.isFolded = false;
  }
}

class Pot {
  constructor(value) {
    this.value = value || 0;
    this.isOpen = true;
    this.players = [];
  }

  close(players) {
    this.players = players;
    this.isOpen = false;
  }
}
