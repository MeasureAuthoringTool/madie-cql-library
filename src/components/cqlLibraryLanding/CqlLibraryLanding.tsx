import React from "react";
import { Route, Switch, BrowserRouter, Redirect } from "react-router-dom";
import NewCqlLibrary from "../newCqlLibrary/NewCqlLibrary";

export function CqlLibraryRoutes() {
  return (
    <Switch>
      <Route exact path="/cql-libraries" component={NewCqlLibrary} />
      <Redirect to="/cql-libraries" path="*" />
    </Switch>
  );
}

const CqlLibraryLanding = () => {
  return (
    <div data-testid="browser-router">
      <BrowserRouter>
        <CqlLibraryRoutes />
      </BrowserRouter>
    </div>
  );
};
export default CqlLibraryLanding;
