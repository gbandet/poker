import React from 'react';
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import Home from './home';
import Room from './room';
import './app.css';


export default class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <h1>Poker rooms</h1>
          <Switch>
          <Route exact path="/">
              <Home />
            </Route>
            <Route path="/room/:id">
              <Room />
            </Route>
            <Route path="*">
              <Redirect to="/" />
            </Route>
          </Switch>
        </div>
      </BrowserRouter>
    );
  } 
}
