import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import NewCqlLibrary from "./CqlLibraryLanding";
import { CqlLibraryServiceApi } from "../../api/useCqlLibraryServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { Model } from "@madie/madie-models";

const cqlLibrary = [
  {
    id: "622e1f46d1fd3729d861e6cb",
    cqlLibraryName: "TestCqlLibrary1",
    model: Model.QICORE,
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

// mocking useHistory
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));

describe("Cql Library Page", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("shows my Cql Libraries on page load", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewCqlLibrary />
      </ApiContextProvider>
    );
    const cqlLibrary1 = await screen.findByText("TestCqlLibrary1");
    expect(cqlLibrary1).toBeInTheDocument();
    const cqlLibrary1Model = await screen.findByText("QI-Core v4.1.1");
    expect(cqlLibrary1Model).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      true
    );
    const myCqlLibrariesTab = screen.getByRole("tab", {
      name: "My CQL Libraries",
    });
    expect(myCqlLibrariesTab).toBeInTheDocument();
    expect(myCqlLibrariesTab).toHaveClass("Mui-selected");
    const allCqlLibrariesTab = screen.getByRole("tab", {
      name: "All CQL Libraries",
    });
    expect(allCqlLibrariesTab).toBeInTheDocument();
    expect(allCqlLibrariesTab).not.toHaveClass("Mui-selected");
  });

  test("shows all Cql Libraries on tab click", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewCqlLibrary />
      </ApiContextProvider>
    );
    const cqlLibrary1 = await screen.findByText("TestCqlLibrary1");
    expect(cqlLibrary1).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      true
    );
    const myCqlLibrariesTab = screen.getByRole("tab", {
      name: "My CQL Libraries",
    });
    expect(myCqlLibrariesTab).toHaveClass("Mui-selected");
    const allCqlLibrariesTab = screen.getByRole("tab", {
      name: "All CQL Libraries",
    });
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest.fn().mockResolvedValue([
      ...cqlLibrary,
      {
        id: "622e1f46d1fd3729d861e7cb",
        cqlLibraryName: "TestCqlLibrary2",
        model: Model.QICORE,
        createdAt: null,
        createdBy: null,
        lastModifiedAt: null,
        lastModifiedBy: null,
      },
    ]);

    userEvent.click(allCqlLibrariesTab);
    const cqlLibrary2 = await screen.findByText("TestCqlLibrary2");
    expect(cqlLibrary2).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      false
    );
  });
});
