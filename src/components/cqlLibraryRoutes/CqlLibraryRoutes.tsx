import React from "react";
import { Route, Switch } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";
import CreateNewCqlLibrary from "../createNewCqlLibrary/CreateNewCqlLibrary";
import TimeoutHandler from "../timeOutHandler/TimeoutHandler";

export function CqlLibraryRoutes() {
  return (
    <>
      <TimeoutHandler timeLeft={1500000} />
      <Switch>
        <Route exact path="/cql-libraries" component={CqlLibraryLanding} />
        <Route
          exact
          path="/cql-libraries/create"
          component={CreateNewCqlLibrary}
        />
      </Switch>
    </>
  );
}

export default CqlLibraryRoutes;
