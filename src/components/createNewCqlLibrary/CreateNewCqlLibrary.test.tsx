import * as React from "react";
import CreateNewCqlLibrary from "./CreateNewCqlLibrary";
import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "../../api/useCqlLibraryServiceApi";
import CqlLibrary from "../../models/CqlLibrary";
import userEvent from "@testing-library/user-event";

const cqlLibrary = {
  id: "cql library ID",
} as CqlLibrary;

jest.mock("../../api/useCqlLibraryServiceApi");
const useCqlLibraryServiceApiMock =
  useCqlLibraryServiceApi as jest.Mock<CqlLibraryServiceApi>;

const serviceApiMockResolved = {
  createCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary),
} as unknown as CqlLibraryServiceApi;

useCqlLibraryServiceApiMock.mockImplementation(() => {
  return serviceApiMockResolved;
});

const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  useHistory: () => {
    const push = () => mockPush("/example");
    return { push };
  },
}));

afterEach(cleanup);

describe("Create New Cql Library Component", () => {
  it("should generate field level error for required Cql Library name", async () => {
    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId("cql-library-name-text-field");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name is required."
      );
    });
  });

  it("should generate field level error for at least one alphabet in cql library name", async () => {
    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    fireEvent.blur(input);
    userEvent.type(input, "123123");
    expect(input.value).toBe("123123");
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for underscore in cql library name", async () => {
    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    fireEvent.blur(input);
    userEvent.type(input, "Testing_libraryName12");
    expect(input.value).toBe("Testing_libraryName12");
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for library name starting with lower case", async () => {
    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    fireEvent.blur(input);
    userEvent.type(input, "testingLibraryName12");
    expect(input.value).toBe("testingLibraryName12");
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for library name with a space", async () => {
    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    fireEvent.blur(input);
    userEvent.type(input, "Testing LibraryName12");
    expect(input.value).toBe("Testing LibraryName12");
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should navigate to cql library home page on cancel", async () => {
    const { getByTestId } = render(<CreateNewCqlLibrary />);
    fireEvent.click(getByTestId("create-new-cql-library-cancel-button"));
    expect(mockPush).toHaveBeenCalledWith("/example");
  });

  it("should handle post service call successfully and redirect user to landing page", async () => {
    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    fireEvent.click(getByTestId("create-new-cql-library-save-button"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/example");
    });
  });

  it("should handle post service call with default error", async () => {
    const error = {
      response: {
        data: {
          message: "Error while creating a new library",
        },
      },
    };
    const serviceApiMockRejected = {
      createCqlLibrary: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceApiMock.mockImplementation(() => {
      return serviceApiMockRejected;
    });

    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    fireEvent.click(getByTestId("create-new-cql-library-save-button"));
    await waitFor(() => {
      expect(getByTestId("cql-library-server-error-alerts")).toHaveTextContent(
        "Error while creating a new library"
      );
    });
  });

  it("should handle post service call with validation errors", async () => {
    const error = {
      response: {
        data: {
          message: "Error while creating a new library",
          validationErrors: {
            error1: "validation error 1",
            error2: "validation error 2",
          },
        },
      },
    };
    const serviceApiMockRejected = {
      createCqlLibrary: jest.fn().mockRejectedValue(error),
    } as unknown as CqlLibraryServiceApi;

    useCqlLibraryServiceApiMock.mockImplementation(() => {
      return serviceApiMockRejected;
    });

    const { getByTestId } = render(<CreateNewCqlLibrary />);
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    fireEvent.click(getByTestId("create-new-cql-library-save-button"));
    await waitFor(() => {
      expect(getByTestId("cql-library-server-error-alerts")).toHaveTextContent(
        "Error while creating a new library error1 : validation error 1 error2 : validation error 2"
      );
    });
  });
});
