import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen } from "@testing-library/react";
import CqlLibraryLanding, { CqlLibraryRoutes } from "./CqlLibraryLanding";
import { ServiceConfig } from "../../api/ServiceContext";
import { CqlLibraryServiceApi } from "../../api/useCqlLibraryServiceApi";

const cqlLibrary = [
  {
    id: "622e1f46d1fd3729d861e6cb",
    cqlLibraryName: "TestCqlLibrary1",
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
  },
];

const serviceConfig: ServiceConfig = {
  measureService: {
    baseUrl: "example-service-url",
  },
  elmTranslationService: {
    baseUrl: "test-elm-service",
  },
  cqlLibraryService: {
    baseUrl: "example-service-url",
  },
};

jest.mock("../../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "test.jwt",
}));

const mockCqlLibraryServiceApi = {
  fetchCqlLibraries: jest.fn().mockResolvedValue(cqlLibrary),
} as unknown as CqlLibraryServiceApi;

jest.mock("../../api/useCqlLibraryServiceApi", () =>
  jest.fn(() => mockCqlLibraryServiceApi)
);

describe("CqlLibraryLanding", () => {
  test("shows the children when the checkbox is checked", async () => {
    render(
      <div id="main">
        <CqlLibraryLanding />
      </div>
    );

    expect(screen.getByTestId("browser-router")).toBeTruthy();
    const cqlLibrary1 = await screen.findByText("TestCqlLibrary1");
    expect(cqlLibrary1).toBeInTheDocument();
  });
});
