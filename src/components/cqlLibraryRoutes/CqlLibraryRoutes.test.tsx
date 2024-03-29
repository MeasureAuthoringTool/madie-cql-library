import "@testing-library/jest-dom";
import { cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import * as React from "react";
import CqlLibraryRoutes from "./CqlLibraryRoutes";

jest.mock("../cqlLibraryLanding/CqlLibraryLanding", () => () => (
  <div data-testid="cql-library-landing-mocked" />
));

jest.mock("../editCqlLibrary/EditCqlLibrary", () => () => (
  <div data-testid="edit-cql-library-mocked" />
));

jest.mock("../createNewLibrary/CreateNewLibrary", () => () => (
  <div data-testid="create-cql-library-mocked" />
));

beforeEach(cleanup);

describe("CqlLibraryRoutes Component", () => {
  it("should redirect to Cql Landing component", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/cql-libraries"]}>
        <CqlLibraryRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId("cql-library-landing-mocked")).toBeInTheDocument();
    });
  });

  it("should redirect to create new cql library component", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/cql-libraries/create"]}>
        <CqlLibraryRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId("create-cql-library-mocked")).toBeInTheDocument();
    });
  });

  it("should redirect to create edit cql library component", async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/cql-libraries/lib1234/edit/details"]}>
        <CqlLibraryRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(getByTestId("edit-cql-library-mocked")).toBeInTheDocument();
    });
  });
});
