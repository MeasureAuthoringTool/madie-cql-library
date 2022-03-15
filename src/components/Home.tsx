import React from "react";
import CqlLibraryRoutes from "./cqlLibraryRoutes/CqlLibraryRoutes";
import { ApiContextProvider } from "../api/ServiceContext";
import useGetServiceConfig from "./config/useGetServiceConfig";
import { BrowserRouter } from "react-router-dom";

export default function Home() {
  const errorPage = (
    <div data-testid="service-config-error">Error loading service config</div>
  );
  const { config, error } = useGetServiceConfig();
  const loadingState = <div data-testid="loading-state">Loading...</div>;

  const loadedState = (
    <BrowserRouter data-testid="cql-library-browser-router">
      <ApiContextProvider value={config}>
        <CqlLibraryRoutes />
      </ApiContextProvider>
    </BrowserRouter>
  );
  let result = config === null ? loadingState : loadedState;
  if (error) {
    result = errorPage;
  }

  return result;
}
