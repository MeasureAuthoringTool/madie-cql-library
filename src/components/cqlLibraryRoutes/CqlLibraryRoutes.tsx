import React from "react";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import CqlLibraryLanding from "../cqlLibraryLanding/CqlLibraryLanding";
import EditCqlLibrary from "../editCqlLibrary/EditCqlLibrary";

export const routesConfig = [
  {
    children: [
      { path: "/cql-libraries/:id/edit/:tab", element: <EditCqlLibrary /> },
      { path: "/cql-libraries", element: <CqlLibraryLanding /> },
    ],
  },
];

const router = createBrowserRouter(routesConfig);

const CqlLibraryRoutes = () => {
  return (
    <div data-testid="cql-library-browser-router">
      <RouterProvider router={router} />
    </div>
  );
};

export default CqlLibraryRoutes;
