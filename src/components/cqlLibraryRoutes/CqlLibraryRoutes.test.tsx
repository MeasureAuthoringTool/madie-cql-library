import "@testing-library/jest-dom";
import { cleanup, render, waitFor, screen } from "@testing-library/react";
import * as React from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { routesConfig } from "./CqlLibraryRoutes";

const { getByTestId } = screen;
const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "base.url",
  },
  elmTranslationService: {
    baseUrl: "",
  },
  cqlLibraryService: {
    baseUrl: "",
  },
  terminologyService: {
    baseUrl: "",
  },
};
jest.mock("../cqlLibraryLanding/CqlLibraryLanding", () => () => (
  <div data-testid="cql-library-landing-mocked" />
));

jest.mock("../editCqlLibrary/EditCqlLibrary", () => () => (
  <div data-testid="edit-cql-library-mocked" />
));

beforeEach(cleanup);

const renderWithRouter = (
  initialEntries = [{ pathname: "/cql-libraries/cql-lib-1234/edit/details" }]
) => {
  const router = createMemoryRouter(routesConfig, {
    initialEntries,
  });

  render(
    <ApiContextProvider value={serviceConfig}>
      <RouterProvider router={router} />
    </ApiContextProvider>
  );
};

describe("CqlLibraryRoutes Component", () => {
  it("should redirect to Cql Landing component", async () => {
    renderWithRouter([{ pathname: "/cql-libraries" }]);
    await waitFor(() => {
      expect(getByTestId("cql-library-landing-mocked")).toBeInTheDocument();
    });
  });

  it("should redirect to create edit cql library component", async () => {
    renderWithRouter([{ pathname: "/cql-libraries/lib1234/edit/details" }]);
    await waitFor(() => {
      expect(getByTestId("edit-cql-library-mocked")).toBeInTheDocument();
    });
  });
});
