import React from "react";
import { Route, Switch, Redirect, BrowserRouter } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";
import CreateNewCqlLibrary from "../createNewCqlLibrary/CreateNewCqlLibrary";

export function CqlLibraryRoutes() {
  return (
    <BrowserRouter>
      <div data-testid="browser-router">
        <Switch>
          <Route exact path="/cql-libraries" component={CqlLibraryLanding} />
          <Route
            exact
            path="/cql-libraries/create"
            component={CreateNewCqlLibrary}
          />
          <Redirect to="/cql-libraries" path="*" />
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default CqlLibraryRoutes;
