import * as React from "react";
import "@testing-library/jest-dom";
import { cleanup, render } from "@testing-library/react";
import Home from "./Home";
import useGetServiceConfig from "./config/useGetServiceConfig";

jest.mock("./cqlLibraryRoutes/CqlLibraryRoutes", () => () => (
  <div data-testid="cql-library-browser-router" />
));

jest.mock("./config/useGetServiceConfig");
const useGetServiceConfigMock = useGetServiceConfig as jest.Mock;

useGetServiceConfigMock.mockImplementation(() => {
  return {
    config: "configTest",
  };
});

beforeEach(cleanup);

describe("Home component", () => {
  it("should render cql library routes component", () => {
    const { getByTestId } = render(<Home />);
    expect(getByTestId("cql-library-browser-router")).toBeInTheDocument();
  });

  it("should render loading state of the component", () => {
    useGetServiceConfigMock.mockImplementation(() => {
      return {
        config: null,
      };
    });

    const { getByTestId } = render(<Home />);
    expect(getByTestId("loading-state")).toBeInTheDocument();
  });

  it("should render config error", () => {
    useGetServiceConfigMock.mockImplementation(() => {
      return {
        error: new Error("Invalid Service Config"),
      };
    });

    const { getByTestId } = render(<Home />);
    expect(getByTestId("service-config-error")).toBeInTheDocument();
  });
});
