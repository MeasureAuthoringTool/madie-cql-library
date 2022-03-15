import React from "react";
import { Route, Switch, Redirect } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";
import TimeoutHandler from "../timeOutHandler/TimeoutHandler";

export function CqlLibraryRoutes() {
  return (
    <div data-testid="browser-router">
      <TimeoutHandler timeLeft={1500000} />
      <Switch>
        <Route exact path="/cql-libraries" component={CqlLibraryLanding} />
        <Redirect to="/cql-libraries" path="*" />
      </Switch>
    </div>
  );
}

export default CqlLibraryRoutes;
