import * as React from "react";
import CreateEditCqlLibrary from "./CreateEditCqlLibrary";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { CqlLibrary, Model } from "@madie/madie-models";
import { MemoryRouter, Route } from "react-router";
import userEvent from "@testing-library/user-event";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import axios from "axios";
import {
  ElmTranslationExternalError,
  synchingEditorCqlContent,
  validateContent,
} from "@madie/madie-editor";

const cqlLibrary = {
  id: "cql library ID",
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
  path = "/cql-libraries/create",
  initialEntries = ["/cql-libraries/create"]
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

describe("Create New Cql Library Component", () => {
  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue(cqlLibrary);
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
    const { getByTestId } = renderWithRouter();
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
    const { getByTestId } = renderWithRouter();
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
    const { getByTestId } = renderWithRouter();
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
    const { getByTestId } = renderWithRouter();
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
    const { getByTestId } = renderWithRouter();
    fireEvent.click(getByTestId("cql-library-cancel-button"));
    expect(mockPush).toHaveBeenCalledWith("/cql-libraries");
  });

  it("should render the model options when clicked", async () => {
    renderWithRouter();
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = screen.getByText("QI-Core v4.1.1");
    expect(qiCoreOption).toBeInTheDocument();
  });

  it("should update the dropdown with the selected option", async () => {
    renderWithRouter();
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = screen.getByText("QI-Core v4.1.1");
    expect(qiCoreOption).toBeInTheDocument();
    userEvent.click(qiCoreOption);
    const qiCore = await screen.findByText("QI-Core v4.1.1");
    expect(qiCore).toBeInTheDocument();
    const qiCoreButton = screen.getByRole("button", { name: /qi-core/i });
    expect(qiCoreButton).toBeInTheDocument();
  });

  it("should display an error when model is not selected", async () => {
    renderWithRouter();
    const input = screen.getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    expect(modelDropdown).toBeInTheDocument();
    userEvent.click(modelDropdown);
    const qiCoreOption = screen.getByText("QI-Core v4.1.1");
    expect(qiCoreOption).toBeInTheDocument();
    userEvent.type(modelDropdown, "{esc}");
    userEvent.dblClick(input);
    await waitFor(() => {
      expect(
        screen.getByText("A CQL library model is required.")
      ).toBeInTheDocument();
    });
    const saveButton = screen.getByTestId("cql-library-save-button");
    expect(saveButton).toBeDisabled();
  });

  it("should have create button disabled until form is valid", async () => {
    renderWithRouter();
    expect(
      screen.getByRole("button", {
        name: "Create Cql Library",
      })
    ).toBeDisabled();
    const input = screen.getByRole("textbox", {
      name: "Cql Library Name",
    }) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    // for some reason, immediately after editing the button is not disabled during the test
    await waitFor(() => {
      expect(
        screen.getByRole("button", {
          name: "Create Cql Library",
        })
      ).toBeDisabled();
    });
    userEvent.click(
      screen.getByRole("button", {
        name: /select a model/i,
      })
    );
    const qiCoreOption = screen.getByText("QI-Core v4.1.1");
    userEvent.click(qiCoreOption);
    const selectedQiCoreDropdown = await screen.findByText("QI-Core v4.1.1");
    expect(selectedQiCoreDropdown).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /qi-core/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: "Create Cql Library",
      })
    ).not.toBeDisabled();
  });

  it("should handle post service call successfully and redirect user to landing page", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    fireEvent.click(getByTestId("cql-library-save-button"));
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/cql-libraries");
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

    mockedAxios.post.mockClear();
    mockedAxios.post.mockRejectedValue(error);

    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = screen.getByText("QI-Core v4.1.1");
    expect(qiCoreOption).toBeInTheDocument();
    userEvent.click(qiCoreOption);
    const qiCore = await screen.findByText("QI-Core v4.1.1");
    expect(qiCore).toBeInTheDocument();
    fireEvent.click(getByTestId("cql-library-save-button"));
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

    mockedAxios.post.mockClear();
    mockedAxios.post.mockRejectedValue(error);

    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field"
    ) as HTMLInputElement;
    userEvent.type(input, "TestingLibraryName12");
    expect(input.value).toBe("TestingLibraryName12");
    const modelDropdown = screen.getByRole("button", {
      name: /select a model/i,
    });
    userEvent.click(modelDropdown);
    const qiCoreOption = screen.getByText("QI-Core v4.1.1");
    expect(qiCoreOption).toBeInTheDocument();
    userEvent.click(qiCoreOption);
    const selectedQiCoreDropdown = await screen.findByText("QI-Core v4.1.1");
    expect(selectedQiCoreDropdown).toBeInTheDocument();
    fireEvent.click(getByTestId("cql-library-save-button"));
    await waitFor(() => {
      expect(getByTestId("cql-library-server-error-alerts")).toHaveTextContent(
        "Error while creating a new library error1 : validation error 1 error2 : validation error 2"
      );
    });
  });

  it("should render a loaded cql library for edit", async () => {
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
      cql: "",
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
      await screen.findByRole("button", { name: "Update CQL Library" })
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByRole("textbox", { name: "Cql Library Name" })
      ).toHaveValue("Library1");
    });

    expect(screen.getByText("QI-Core v4.1.1")).toBeInTheDocument();
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
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    expect(mockedAxios.get).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", { name: "Update CQL Library" })
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
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    const updateButton1 = await screen.findByRole("button", {
      name: "Update CQL Library",
    });

    expect(updateButton1).toBeInTheDocument();
    expect(updateButton1).toBeDisabled();

    expect(
      screen.getByText("An error occurred while fetching the CQL Library!")
    ).toBeInTheDocument();

    const input = screen.getByRole("textbox", {
      name: "Cql Library Name",
    }) as HTMLInputElement;
    expect(input).toHaveAttribute("readonly");
    userEvent.click(
      screen.getByRole("button", {
        name: /select a model/i,
      })
    );
    expect(screen.queryByText("QI-Core")).not.toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: "Update CQL Library",
      })
    ).toBeDisabled();
  });

  it("should display an error when update cql library fails", async () => {
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
      cql: "",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
    mockedAxios.put.mockRejectedValue({
      response: {
        data: {
          message: "Error while creating a new library",
          validationErrors: {
            error1: "validation error 1",
            error2: "validation error 2",
          },
        },
      },
    });

    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    expect(mockedAxios.get).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", {
        name: "Update CQL Library",
      })
    ).toBeInTheDocument();

    const libraryNameInput = screen.getByRole("textbox", {
      name: "Cql Library Name",
    });
    expect(libraryNameInput).toHaveValue("Library1");
    userEvent.clear(libraryNameInput);
    userEvent.type(libraryNameInput, "UpdatedName");
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: "Cql Library Name",
        })
      ).toHaveValue("UpdatedName")
    );
    const updateButton = screen.getByRole("button", {
      name: "Update CQL Library",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);

    await waitFor(() => expect(mockedAxios.put).toHaveBeenCalled());
    await waitFor(() => {
      expect(
        screen.getByText(
          "Error while creating a new library error1 : validation error 1 error2 : validation error 2"
        )
      ).toBeInTheDocument();
    });
  });

  it("should update an existing cql library with the synched cql library name, version and display a warning message", async () => {
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
      cql: "",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
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
        name: "Update CQL Library",
      })
    ).toBeInTheDocument();

    const libraryNameInput = screen.getByRole("textbox", {
      name: "Cql Library Name",
    });
    expect(libraryNameInput).toHaveValue("Library1");
    userEvent.clear(libraryNameInput);
    userEvent.type(libraryNameInput, "UpdatedName");
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: "Cql Library Name",
        })
      ).toHaveValue("UpdatedName")
    );
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("");

    fireEvent.change(screen.getByTestId("cql-library-editor"), {
      target: {
        value: "library UpdatedNameTets versionsszz '0.0.000'",
      },
    });

    const updateButton = screen.getByRole("button", {
      name: "Update CQL Library",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);

    await waitFor(() => expect(mockPush).toBeCalledWith("/cql-libraries"));
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "/cql-libraries/cql-lib-1234",
      {
        id: "cql-lib-1234",
        cqlLibraryName: "UpdatedName",
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
      },
      { headers: { Authorization: "Bearer test.jwt" } }
    );

    const successMessage = screen.getByTestId("cql-library-warning-alert");
    expect(successMessage.textContent).toEqual(
      "CQL updated successfully! Library Name and/or Version can not be updated in the CQL Editor. MADiE has overwritten the updated Library Name and/or Version."
    );
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
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
      cql: "",
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
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
        name: "Update CQL Library",
      })
    ).toBeInTheDocument();

    const libraryNameInput = screen.getByRole("textbox", {
      name: "Cql Library Name",
    });
    expect(libraryNameInput).toHaveValue("Library1");
    userEvent.clear(libraryNameInput);
    userEvent.type(libraryNameInput, "UpdatedName");
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: "Cql Library Name",
        })
      ).toHaveValue("UpdatedName")
    );
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("");

    fireEvent.change(screen.getByTestId("cql-library-editor"), {
      target: {
        value: "library UpdateName version '1.0.000'",
      },
    });

    const updateButton = screen.getByRole("button", {
      name: "Update CQL Library",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);

    await waitFor(() => expect(mockPush).toBeCalledWith("/cql-libraries"));
    expect(mockedAxios.put).toHaveBeenCalledWith(
      "/cql-libraries/cql-lib-1234",
      {
        id: "cql-lib-1234",
        cqlLibraryName: "UpdatedName",
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
      },
      { headers: { Authorization: "Bearer test.jwt" } }
    );

    const successMessage = screen.getByTestId("cql-library-success-alert");
    expect(successMessage.textContent).toEqual("CQL saved successfully");
    expect(mockedAxios.put).toHaveBeenCalledTimes(1);
  });

  it("should allow update when cql is null", async () => {
    const parseErrors = false;
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
      cql: null,
      createdAt: "",
      createdBy: "",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
    mockedAxios.put.mockResolvedValue({
      data: { ...cqlLibrary, cqlLibraryName: "UpdatedName" },
    });
    renderWithRouter("/cql-libraries/:id/edit", [
      "/cql-libraries/cql-lib-1234/edit",
    ]);

    expect(mockedAxios.get).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", {
        name: "Update CQL Library",
      })
    ).toBeInTheDocument();

    const libraryNameInput = screen.getByRole("textbox", {
      name: "Cql Library Name",
    });
    expect(libraryNameInput).toHaveValue("Library1");
    userEvent.clear(libraryNameInput);
    userEvent.type(libraryNameInput, "UpdatedName");
    await waitFor(() =>
      expect(
        screen.getByRole("textbox", {
          name: "Cql Library Name",
        })
      ).toHaveValue("UpdatedName")
    );

    const updateButton = screen.getByRole("button", {
      name: "Update CQL Library",
    });
    expect(updateButton).not.toBeDisabled();
  });

  it("should be able to show the input Cql Library on the editor", () => {
    renderWithRouter();
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    userEvent.type(input, "library testCql version '1.0.000'");
    expect(input).toHaveValue("library testCql version '1.0.000'");
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
        name: "Update CQL Library",
      })
    ).toBeInTheDocument();

    const libraryNameInput = screen.getByRole("textbox", {
      name: "Cql Library Name",
    });
    expect(libraryNameInput).toHaveValue("Library1");
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("library testCql version '1.0.000'");
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
      screen.getByRole("textbox", { name: "Cql Library Name" })
    ).toHaveAttribute("readonly");
    expect(
      screen.getByRole("button", { name: "Update CQL Library" })
    ).toBeDisabled();
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
});
