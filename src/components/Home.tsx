import React from "react";
import { BrowserRouter } from "react-router-dom";
import { CqlLibraryRoutes } from "./cqlLibraryRoutes/CqlLibraryRoutes";
import { ApiContextProvider } from "../api/ServiceContext";
import useGetServiceConfig from "./config/useGetServiceConfig";

export default function Home() {
  const errorPage = <div>Error loading service config</div>;
  const { config, error } = useGetServiceConfig();
  const loadingState = <div>Loading...</div>;

  const loadedState = (
    <ApiContextProvider value={config}>
      <CqlLibraryRoutes />
    </ApiContextProvider>
  );
  let result = config === null ? loadingState : loadedState;
  if (error) {
    result = errorPage;
  }

  return result;
}
