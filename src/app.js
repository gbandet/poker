import React from 'react';
import { BrowserRouter, Redirect, Route, Switch } from "react-router-dom";
import Home from './home';
import Room from './room';
import 'bulma/css/bulma.css'
import './app.css';


export default class App extends React.Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <nav className="navbar" role="navigation" aria-label="main navigation">
            <div className="navbar-brand">
              <a className="navbar-item" href="/">
                <span className="is-size-1">Poker rooms</span>
              </a>
            </div>
          </nav>
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
