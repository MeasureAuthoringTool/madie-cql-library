import * as React from "react";
import CreateEditCqlLibrary from "./EditCqlLibrary";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { CqlLibrary, Model } from "@madie/madie-models";
import { MemoryRouter, Route } from "react-router";
import userEvent from "@testing-library/user-event";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { act, Simulate } from "react-dom/test-utils";
import axios from "axios";
import {
  ElmTranslationExternalError,
  synchingEditorCqlContent,
  validateContent,
} from "@madie/madie-editor";

jest.mock("@madie/madie-util", () => ({
  cqlLibraryStore: {
    state: null,
    initialState: null,
    updateLibrary: () => {
      return null;
    },
    subscribe: (set) => {
      set(null);
      return { unsubscribe: () => null };
    },
    unsubscribe: () => null,
  },
  // useOktaTokens: () => ({
  //   getAccessToken: () => "test.jwt",
  //   getUserName: () => "nosec@example.com", //#nosec
  // }),
}));
const cqlLibrary = {
  id: "cql-lib-1234",
  cqlLibraryName: "Library1",
  model: Model.QICORE,
  draft: true,
  version: null,
  groupId: null,
  cqlErrors: false,
  publisher: null,
  description: null,
  experimental: null,
  cql: "",
  createdAt: "",
  createdBy: "",
  lastModifiedAt: "",
  lastModifiedBy: "",
} as CqlLibrary;

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

// mocking useHistory
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useHistory: () => {
    const push = (path: string) => mockPush(path);
    return { push };
  },
}));

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
};

const cqlToElmExternalErrors: ElmTranslationExternalError[] = [
  {
    libraryId: "SupplementalDataElements",
    libraryVersion: "1.0.000",
    startLine: 14,
    startChar: 1,
    endLine: 14,
    endChar: 52,
    message:
      "Could not resolve reference to library QICoreCommon, version 1.0.000 because version 2.0.000 is already loaded.",
    errorType: "include",
    errorSeverity: "Error",
    targetIncludeLibraryId: "QICoreCommon",
    targetIncludeLibraryVersionId: "1.0.000",
    type: "CqlToElmError",
  },
];

const renderWithRouter = (
  path = "/cql-libraries/:id/edit/details",
  initialEntries = ["/cql-libraries/cql-lib-1234/edit/details"]
) => {
  return render(
    <ApiContextProvider value={serviceConfig}>
      <MemoryRouter initialEntries={initialEntries}>
        <Route path={path}>
          <CreateEditCqlLibrary />
        </Route>
      </MemoryRouter>
    </ApiContextProvider>
  );
};

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

describe("Edit Cql Library Component", () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
  });

  it("should render form and cql library editor", () => {
    const { getByTestId } = renderWithRouter();
    const cqlLibraryEditor = getByTestId("cql-library-editor-component");
    const form = getByTestId("create-new-cql-library-form");
    const input = getByTestId("cql-library-editor") as HTMLInputElement;
    expect(form).toBeInTheDocument();
    expect(cqlLibraryEditor).toBeInTheDocument();
    expect(input.value).toEqual("");
  });

  it("should generate field level error for required Cql Library name", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId("cql-library-name-text-field-input");
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name is required."
      );
    });
  });

  it("should generate field level error for at least one alphabet in cql library name", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId("cql-library-name-text-field-input");
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("readonly");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "1234");
    expect(input.value).toBe("1234");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for underscore in cql library name", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId("cql-library-name-text-field-input");
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("readonly");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "Testing_libraryName12");
    expect(input.value).toBe("Testing_libraryName12");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for library name starting with lower case", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId("cql-library-name-text-field-input");
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("readonly");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "testinglibraryName12");
    expect(input.value).toBe("testinglibraryName12");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should generate field level error for library name with a space", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId("cql-library-name-text-field-input");
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("readonly");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "Testing libraryName12");
    expect(input.value).toBe("Testing libraryName12");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(getByTestId("cqlLibraryName-helper-text")).not.toBe(null);
      expect(getByTestId("cqlLibraryName-helper-text")).toHaveTextContent(
        "Library name must start with an upper case letter, followed by alpha-numeric character(s) and must not contain spaces or other special characters."
      );
    });
  });

  it("should navigate to cql library home page on cancel", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId("cql-library-name-text-field-input");
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("readonly");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "TestinglibraryName12");
    expect(input.value).toBe("TestinglibraryName12");
    fireEvent.blur(input);
    fireEvent.click(getByTestId("cql-library-cancel-button"));
    expect(mockPush).toHaveBeenCalledWith("/cql-libraries");
  });

  it("should have Save button disabled until form is valid and dirty", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId("cql-library-name-text-field-input");
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    expect(
      screen.getByRole("button", {
        name: "Save",
      })
    ).toBeDisabled();
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "TestinglibraryName12");
    expect(input.value).toBe("TestinglibraryName12");
    // for some reason, immediately after editing the button is not disabled during the test
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Save",
        })
      ).not.toBeDisabled();
    });
  });

  it("should render a loaded cql library for edit", async () => {
    renderWithRouter();
    expect(mockedAxios.get).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("readonly");
    });
    const input = (await screen.getByTestId(
      "cql-library-name-text-field-input"
    )) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("Library1");
    fireEvent.blur(input);
  });

  it("should display an error when existing cql library cannot be loaded", async () => {
    mockedAxios.get.mockClear();
    mockedAxios.get.mockRejectedValue({
      response: {
        data: {
          message: "Test error!!",
        },
      },
    });
    renderWithRouter("/cql-libraries/:id/edit/details", [
      "/cql-libraries/cql-lib-1234/edit/details",
    ]);

    expect(mockedAxios.get).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("An error occurred while fetching the CQL Library!")
    ).toBeInTheDocument();
  });

  it("should prevent update when cql library cannot be loaded", async () => {
    mockedAxios.get.mockClear();
    mockedAxios.get.mockRejectedValue({
      response: {
        data: {
          message: "Test error!!",
        },
      },
    });
    renderWithRouter("/cql-libraries/:id/edit/details", [
      "/cql-libraries/cql-lib-1234/edit/details",
    ]);

    const updateButton1 = await screen.findByRole("button", {
      name: "Save",
    });

    expect(updateButton1).toBeInTheDocument();
    expect(updateButton1).toBeDisabled();

    expect(
      screen.getByText("An error occurred while fetching the CQL Library!")
    ).toBeInTheDocument();

    expect(
      screen.getByTestId("cql-library-name-text-field-input")
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Save",
      })
    ).toBeDisabled();
  });

  it("should update an existing cql library with the synched cql library name, version and display a warning message", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return "library UpdateName version '1.0.000'";
      });
    mockedAxios.put.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cqlLibraryName: "UpdatedName",
        cql: synchingEditorCqlContent,
      },
    });
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    expect(mockedAxios.get).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", {
        name: "Save",
      })
    ).toBeInTheDocument();

    const libraryNameInput = screen.getByTestId(
      "cql-library-name-text-field-input"
    );

    expect(libraryNameInput.value).toBe("Library1");
    userEvent.clear(libraryNameInput);
    userEvent.type(libraryNameInput, "UpdatedName1");
    fireEvent.blur(libraryNameInput);
    expect(libraryNameInput.value).toBe("UpdatedName1");
    // await waitFor(() => expect(libraryNameInput.value).toBe("UpdatedName1"));
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("");

    fireEvent.change(screen.getByTestId("cql-library-editor"), {
      target: {
        value: "library UpdatedNameTets versionsszz '0.0.000'",
      },
    });

    const updateButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);
    await waitFor(() => {
      const successMessage = screen.getByTestId("cql-library-warning-alert");
      expect(successMessage.textContent).toEqual(
        "CQL updated successfully! Library Name and/or Version can not be updated in the CQL Editor. MADiE has overwritten the updated Library Name and/or Version."
      );
    });
  });

  it("should update an existing cql library and displaying success message", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      model: Model.QICORE,
      draft: true,
      version: null,
      groupId: null,
      cqlErrors: false,
      publisher: null,
      description: null,
      experimental: null,
      cql: "library UpdateName version '1.0.000'",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    mockedAxios.put.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cqlLibraryName: "UpdatedName",
        cql: synchingEditorCqlContent,
      },
    });
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    expect(mockedAxios.get).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", {
        name: "Save",
      })
    ).toBeInTheDocument();

    const libraryNode = await screen.getByTestId(
      "cql-library-name-text-field-input"
    );
    expect(libraryNode.value).toBe("Library1");
    Simulate.change(libraryNode);

    userEvent.clear(libraryNode);
    userEvent.type(libraryNode, "UpdatedName");
    Simulate.change(libraryNode);

    await waitFor(() => expect(libraryNode.value).toBe("UpdatedName"));

    fireEvent.change(screen.getByTestId("cql-library-editor"), {
      target: {
        value: "library UpdateName version '1.0.000'",
      },
    });

    const updateButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);
    await waitFor(() => {
      const successMessage = screen.getByTestId("cql-library-success-alert");
      expect(successMessage.textContent).toEqual("CQL saved successfully");
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
  });

  it("should render existing CQL in the editor", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      model: Model.QICORE,
      draft: true,
      version: null,
      groupId: null,
      cqlErrors: false,
      publisher: null,
      description: null,
      experimental: null,
      cql: "library testCql version '1.0.000'",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    expect(mockedAxios.get).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", {
        name: "Save",
      })
    ).toBeInTheDocument();

    const libraryNameInput = screen.getByTestId(
      "cql-library-name-text-field-input"
    );

    expect(libraryNameInput).toHaveValue("Library1");
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("library testCql version '1.0.000'");
  });

  it("should display toast for external errors received from Cql to Elm translation", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      model: Model.QICORE,
      draft: true,
      version: null,
      groupId: null,
      cqlErrors: false,
      publisher: null,
      description: null,
      experimental: null,
      cql: "some cql string",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        externalErrors: cqlToElmExternalErrors,
      });
    });

    const toastMessage = await screen.findByText(
      cqlToElmExternalErrors[0].message
    );
    expect(toastMessage).toBeInTheDocument();
  });

  it("should be able to close toast message", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      model: Model.QICORE,
      draft: true,
      version: null,
      groupId: null,
      cqlErrors: false,
      publisher: null,
      description: null,
      experimental: null,
      cql: "some cql string",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        externalErrors: cqlToElmExternalErrors,
      });
    });
    const toastCloseButton = await screen.findByRole("button", {
      name: "close",
    });
    expect(toastCloseButton).toBeInTheDocument();
    fireEvent.click(toastCloseButton);
    expect(toastCloseButton).not.toBeInTheDocument();
  });
  it("should render all fields in read-only mode when loaded library is not a draft", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      model: Model.QICORE,
      draft: false,
      version: null,
      groupId: null,
      publisher: null,
      description: null,
      experimental: null,
      cql: "library testCql version '1.0.000'",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    expect(
      await screen.findByText(
        "CQL Library is not a draft. Only drafts can be edited."
      )
    ).toBeInTheDocument();

    expect(screen.getByTestId("cql-library-editor")).toHaveAttribute(
      "readonly"
    );
    expect(
      screen.getByTestId("cql-library-name-text-field-input")
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
