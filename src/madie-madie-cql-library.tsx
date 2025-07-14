import React from "react";
import ReactDOMClient from "react-dom/client";
import singleSpaReact from "single-spa-react";
import Root from "./root.component";
import Home from "./components/Home";

// TypeScript doesn't know UMD has createRoot; cast to any
const lifecycles = singleSpaReact({
  React,
  ReactDOMClient,
  renderType: "createRoot",
  rootComponent: Root,
  errorBoundary(err, info, props) {
    console.error("madie-cql-library-error", err);
    return <div>The app has fallen and cannot get up. Please contact the help desk.</div>;
  },
});

export const MadieCqlLibrary = Home;
export const { bootstrap, mount, unmount } = lifecycles;
