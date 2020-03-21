import React from 'react';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {message: ""};
    window.comp = this;
  };

  componentDidMount() {
    this.ws = new WebSocket("ws://localhost:8090");
    this.ws.onmessage = (event) => {
      console.log('Received: ', event.data);
      console.log(this);
      this.setState({message: event.data});
    };
  }

  click() {
    console.log('Send message');
    this.ws.send('TEST');
  }

  render() {
    return (
      <div>
        <h1>TEST</h1>
        <button onClick={() => this.click()}>SEND</button>
        <span>{this.state.message}</span>
      </div>
    );
  } 
}

export default App;
