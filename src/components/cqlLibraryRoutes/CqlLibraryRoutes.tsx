import React from "react";
import { Route, Switch } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";
import EditCqlLibrary from "../editCqlLibrary/EditCqlLibrary";
import CreateNewLibrary from "../createNewLibrary/CreateNewLibrary";

export function CqlLibraryRoutes() {
  return (
    <>
      <Switch>
        <Route exact path="/cql-libraries" component={CqlLibraryLanding} />
        <Route
          exact
          path="/cql-libraries/create"
          component={CreateNewLibrary}
        />
        <Route path="/cql-libraries/:id/edit/:tab" component={EditCqlLibrary} />
      </Switch>
    </>
  );
}

export default CqlLibraryRoutes;
