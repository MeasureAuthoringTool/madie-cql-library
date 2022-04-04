import React from "react";
import { Route, Switch } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";
import CreateEditCqlLibrary from "../createEditCqlLibrary/CreateEditCqlLibrary";
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
          component={CreateEditCqlLibrary}
        />
        <Route
          exact
          path="/cql-libraries/:id/edit"
          component={CreateEditCqlLibrary}
        />
      </Switch>
    </>
  );
}

export default CqlLibraryRoutes;
