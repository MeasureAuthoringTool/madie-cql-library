import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import * as React from "react";
import CqlLibraryRoutes from "./CqlLibraryRoutes";
import TimeoutHandler from "../timeOutHandler/TimeoutHandler";

jest.mock("../cqlLibraryLanding/CqlLibraryLanding", () => () => {
  return (
    <div id="main" data-testid="cql-library-landing-mocked">
      Cql Library Landing
    </div>
  );
});

describe("testing routes", () => {
  test("should redirect to Cql Landing component when /cql-libraries route is called", () => {
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
