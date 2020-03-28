import React from 'react';
import { withRouter } from "react-router-dom";


class Room extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      inRoom: false,
      isJoining: false,
      joinError: '',
      name: sessionStorage.getItem('name'),
      status: [],
      bet: 0,
    };
  };

  componentDidMount() {
    this.initSocket();
  }

  joinRoom() {
    sessionStorage.setItem('name', this.state.name);
    this.sendMessage('join', {
      room: this.props.match.params.id,
      name: sessionStorage.getItem('name'),
    });
    this.setState({
      isJoining: true,
      joinError: '',
    });
  }

  initSocket() {
    this.ws = new WebSocket("ws://localhost:8090");
    this.ws.onmessage = event => this.handleMessage(event.data);
    this.ws.onopen = () => {
      this.sendMessage('register', sessionStorage.getItem('id'));
    }
  }

  handleMessage(message) {
    try {
      message = JSON.parse(message);
    } catch(error) {
      console.error('Cannot decode JSON from message.');
    }
    console.log('Receive', message.type, message.payload);
    switch (message.type) {
      case 'registered':
        this.handleRegistered(message.payload);
        break;
      case 'status':
        this.handleStatus(message.payload);
        break;
      case 'roomFull':
        this.setState({
          isJoining: false,
          joinError: 'Room is full',
        })
        break;
      case 'error':
        this.handleError(message.payload);
        break;
      default:
        console.error('Unknown message type: ', message);
    }
  }

  handleRegistered(payload) {
    sessionStorage.setItem('id', payload);
  }

  handleStatus(payload) {
    this.setState({
      inRoom: true,
      status: payload,
    });
  }

  handleError(error) {
    console.error(error);
  }

  startGame() {
    this.sendMessage('start');
  }

  fold() {
    this.sendMessage('fold');
  }

  bet() {
    this.sendMessage('bet', parseInt(this.state.bet));
  }

  sendMessage(type, payload) {
    const message = {
      type: type,
      payload: payload,
    };
    console.log("Send", type, payload);
    this.ws.send(JSON.stringify(message));
  }

  render() {
    let content;
    if (!this.state.inRoom) {
      content = this.renderJoinForm();
    } else {
      content = this.renderRoom();
    }
    return (
      <div className="Room">
        {content}
      </div>
    );
  }

  renderJoinForm() {
    return (
      <div>
        <section className="hero is-light">
          <div className="hero-body">
            {this.state.joinError &&
              <h1 className="subtitle has-text-danger">Error: {this.state.joinError}</h1>
            }
            <div className="field">
              <label className="label">Name</label>
              <div className="control">
                <input className="input" placeholder="Name" value={this.state.name}
                    onChange={(event) => this.setState({name: event.target.value})}/>
              </div>
            </div>
            {!this.state.isJoining &&
              <button className="button is-link" disabled={this.state.name === ""} onClick={() => this.joinRoom()}>Join</button>
            }
            {this.state.isJoining &&
              <button className="button is-link" disabled={true}>Joining</button>
            }
          </div>
        </section>
      </div>
    );
  }

  renderRoom() {
    return (
      <div>
        <label>Status: </label>
        <pre>{JSON.stringify(this.state.status, null, 2)}</pre>
        <button className="button" onClick={() => this.startGame()}>Start</button>
        <div className="field">
          <label className="label">Bet</label>
          <div className="control">
            <input className="input" placeholder="10" value={this.state.nambet}
                onChange={(event) => this.setState({bet: event.target.value})}/>
          </div>
        </div>
        <button className="button" onClick={() => this.bet()}>Bet</button>
        <button className="button" onClick={() => this.fold()}>Fold</button>
      </div>
    );
  }
}

export default withRouter(Room);
