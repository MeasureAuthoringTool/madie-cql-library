import React from "react";
import { BrowserRouter } from "react-router-dom";
import CqlLibraryLanding from "./cqlLibraryLanding/CqlLibraryLanding";
import { ApiContextProvider } from "../api/ServiceContext";
import useGetServiceConfig from "./config/useGetServiceConfig";

export default function Home() {
  const errorPage = <div>Error loading service config</div>;
  const { config, error } = useGetServiceConfig();
  const loadingState = <div>Loading...</div>;

  const loadedState = (
    <BrowserRouter>
      <ApiContextProvider value={config}>
        <CqlLibraryLanding />
      </ApiContextProvider>
    </BrowserRouter>
  );
  let result = config === null ? loadingState : loadedState;
  if (error) {
    result = errorPage;
  }

  return result;
}
