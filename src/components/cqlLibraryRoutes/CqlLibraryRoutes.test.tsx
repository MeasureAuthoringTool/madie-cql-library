import "@testing-library/jest-dom";
import { render, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { Route } from "react-router-dom";
import * as React from "react";
import CqlLibraryRoutes from "./CqlLibraryRoutes";

jest.mock("../cqlLibraryLanding/CqlLibraryLanding", () => () => {
  return (
    <div data-testid="cql-library-landing-mocked">Cql Library Landing</div>
  );
});

describe("Router component", () => {
  test("", () => {
    render(
      <MemoryRouter initialEntries={["/cql-libraries"]}>
        <CqlLibraryRoutes />
      </MemoryRouter>
    );
    const landingComponent = screen.getByTestId("cql-library-landing-mocked");
    expect(landingComponent).toBeInTheDocument();
    const landingComponentText = screen.getByText("Cql Library Landing");
    expect(landingComponentText).toBeInTheDocument();
  });
});
