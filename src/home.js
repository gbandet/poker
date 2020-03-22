import React from 'react';
import { withRouter } from "react-router-dom";
import './home.css';


class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {roomId: ""};
  }

  createRoom() {
    const id = Math.floor(Math.random() * 1000000000);
    this.props.history.push(`/room/${id}`);
  }

  joinRoom() {
    this.props.history.push(`/room/${this.state.roomId}`);
  }

  render() {
    return (
      <div className="Home">
        <section className="hero is-light">
          <div className="hero-body">
            <ul>
              <li>
                <span className="subtitle">Create a new room</span>
                <button className="button is-link is-small" onClick={() => this.createRoom()}>Create</button>
              </li>
              <li>
                <span className="subtitle">Join room #</span>
                <input className="input is-small" value={this.state.roomId} onChange={(event) => this.setState({roomId: event.target.value})} />
                <button className="button is-link is-small" disabled={this.state.roomId === ""} onClick={() => this.joinRoom()}>Join</button>
              </li>
            </ul>
          </div>
        </section>
      </div>
    );
  }
}

export default withRouter(Home);
