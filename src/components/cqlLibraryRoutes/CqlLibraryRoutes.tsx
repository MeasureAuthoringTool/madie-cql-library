import React from "react";
import { Route, Switch, Redirect, BrowserRouter } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";

export function CqlLibraryRoutes() {
  return (
    <BrowserRouter>
      <div data-testid="browser-router">
        <Switch>
          <Route exact path="/cql-libraries" component={CqlLibraryLanding} />
          <Redirect to="/cql-libraries" path="*" />
        </Switch>
      </div>
    </BrowserRouter>
  );
}

export default CqlLibraryRoutes;