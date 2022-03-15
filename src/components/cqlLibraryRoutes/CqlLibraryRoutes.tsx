import React from "react";
import { Route, Switch } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";
import CreateNewCqlLibrary from "../createNewCqlLibrary/CreateNewCqlLibrary";

export function CqlLibraryRoutes() {
  return (
    <Switch>
      <Route exact path="/cql-libraries" component={CqlLibraryLanding} />
      <Route
        exact
        path="/cql-libraries/create"
        component={CreateNewCqlLibrary}
      />
    </Switch>
  );
}

export default CqlLibraryRoutes;
