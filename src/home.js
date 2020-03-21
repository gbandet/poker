import React from 'react';
import { withRouter } from "react-router-dom";


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

  updateRoomId(event) {
    this.setState({roomId: event.target.value});
  }

  render() {
    return (
      <div>
        <button onClick={() => this.createRoom()}>Create room</button>
        <input value={this.state.roomId} onChange={(event) => this.updateRoomId(event)}/>
        <button onClick={() => this.joinRoom()}>Join room</button>
      </div>
    );
  }
}

export default withRouter(Home);