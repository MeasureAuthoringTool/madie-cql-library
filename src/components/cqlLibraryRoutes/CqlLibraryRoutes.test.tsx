import "@testing-library/jest-dom";
import { cleanup, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import * as React from "react";
import CqlLibraryRoutes from "./CqlLibraryRoutes";

jest.mock("../cqlLibraryLanding/CqlLibraryLanding", () => () => {
  return <div data-testid="cql-library-landing-mocked">Landing Component</div>;
});

jest.mock("../createNewCqlLibrary/CreateNewCqlLibrary", () => () => {
  return (
    <div data-testid="create-new-cql-library-mocked">
      create new library component
    </div>
  );
});

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

  it("should redirect to create new cql library component", () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/cql-libraries/create"]}>
        <CqlLibraryRoutes />
      </MemoryRouter>
    );
    expect(getByTestId("create-new-cql-library-mocked")).toBeInTheDocument();
  });
});
