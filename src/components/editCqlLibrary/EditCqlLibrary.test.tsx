import * as React from "react";
import CreateEditCqlLibrary from "./EditCqlLibrary";
import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { CqlLibrary, Model } from "@madie/madie-models";
import { MemoryRouter, Route } from "react-router";
import userEvent from "@testing-library/user-event";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { Simulate } from "react-dom/test-utils";
import axios from "../../api/axios-instance";
import {
  ElmTranslationExternalError,
  isUsingEmpty,
  synchingEditorCqlContent,
  validateContent,
} from "@madie/madie-editor";
import { checkUserCanEdit } from "@madie/madie-util";

jest.mock("@madie/madie-util", () => ({
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  useDocumentTitle: jest.fn(),
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
  routeHandlerStore: {
    subscribe: (set) => {
      // set(measure)
      return { unsubscribe: () => null };
    },
    updateRouteHandlerState: () => null,
    state: { canTravel: false, pendingPath: "" },
    initialState: { canTravel: false, pendingPath: "" },
  },
  useOrganizationApi: jest.fn(() => ({
    getAllOrganizations: jest.fn().mockResolvedValue(organizations),
  })),
}));

const cqlLibrary = {
  id: "cql-lib-1234",
  cqlLibraryName: "Library1",
  librarySetId: "",
  model: Model.QICORE,
  cqlErrors: false,
  cql: "",
  version: "testVersion",
  draft: true,
  createdAt: "",
  createdBy: "john doe",
  lastModifiedAt: "",
  lastModifiedBy: "",
  publisher: "Tester",
  description: "testing stuff.",
  experimental: false,
} as CqlLibrary;

const organizations = [
  {
    id: "1234",
    name: "Org1",
    oid: "1.2.3.4",
  },
  {
    id: "56789",
    name: "Org2",
    oid: "5.6.7.8",
  },
];

jest.mock("../../api/axios-instance");
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
  terminologyService: {
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
    const form = getByTestId("edit-library-form");
    const input = getByTestId("cql-library-editor") as HTMLInputElement;
    expect(form).toBeInTheDocument();
    expect(cqlLibraryEditor).toBeInTheDocument();
    expect(input.value).toEqual("");
  });

  it("should generate field level error for required Cql Library name", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
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
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
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

  it("should generate field level error for underscore in cql library name for QI-Core", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
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
      expect(
        screen.getByRole("button", {
          name: "Save",
        })
      ).toBeDisabled();
    });
  });

  it("should not generate field level error for underscore in cql library name for qdm", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { ...cqlLibrary, model: Model.QDM_5_6 },
    });
    const { getByTestId, queryByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "Testing_libraryName12");
    expect(input.value).toBe("Testing_libraryName12");
    fireEvent.blur(input);
    await waitFor(() => {
      expect(queryByTestId("cqlLibraryName-helper-text")).toBe(null);
      expect(
        screen.getByRole("button", {
          name: "Save",
        })
      ).not.toBeDisabled();
    });
  });

  it("should generate field level error for library name starting with lower case", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
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
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
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

  it("should close dialog on cancel", async () => {
    const { getByTestId, queryByText } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "TestinglibraryName12");
    expect(input.value).toBe("TestinglibraryName12");
    fireEvent.blur(input);
    fireEvent.click(getByTestId("cql-library-cancel-button"));
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const cancelButton = await screen.getByTestId(
      "discard-dialog-cancel-button"
    );
    expect(queryByText("You have unsaved changes.")).toBeVisible();
    expect(cancelButton).toBeInTheDocument();
    fireEvent.click(cancelButton);
    await waitFor(() => {
      expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("should navigate away on continue", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
    await waitFor(() => {
      expect(input.value).toBe("Library1");
    });
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
    });
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "TestinglibraryName12");
    expect(input.value).toBe("TestinglibraryName12");
    fireEvent.blur(input);
    fireEvent.click(getByTestId("cql-library-cancel-button"));
    const discardDialog = await screen.getByTestId("discard-dialog");
    expect(discardDialog).toBeInTheDocument();
    const continueButton = await screen.getByTestId(
      "discard-dialog-continue-button"
    );
    expect(continueButton).toBeInTheDocument();
    fireEvent.click(continueButton);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/cql-libraries");
      // expect(queryByText("You have unsaved changes.")).not.toBeVisible();
    });
  });

  it("should have Save button disabled until form is valid and dirty", async () => {
    const { getByTestId } = renderWithRouter();
    const input = getByTestId(
      "cql-library-name-text-field-input"
    ) as HTMLInputElement;
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
      ).not.toHaveAttribute("disabled");
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
    ).toHaveAttribute("disabled");
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    expect(
      screen.getByRole("button", {
        name: "Save",
      })
    ).toBeDisabled();
  });

  it("should revert change in library statement, using statement and value version if encountered", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library UpdateName version '1.0.000'",
          isLibraryStatementChanged: true,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
        };
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
    ) as HTMLInputElement;

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
      const successMessage = screen.getByTestId("generic-success-text-header");
      expect(successMessage.textContent).toEqual(
        "CQL updated successfully but the following issues were found"
      );
    });
    const warningMessage = screen.getByTestId("library-warning");
    expect(warningMessage.textContent).toEqual(
      "Library statement was incorrect. MADiE has overwritten it."
    );
  });

  it("should update an existing cql library with the updated cql library name, version and warn about blank using", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return "library UpdateName version '1.0.000'";
      });

    isUsingEmpty.mockClear().mockImplementation(() => true);

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
    ) as HTMLInputElement;

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
      const successMessage = screen.getByTestId("generic-success-text-header");
      expect(successMessage.textContent).toEqual(
        "CQL updated successfully but the following issues were found"
      );
    });
  });

  it("should update an existing cql library and displaying success message", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      librarySetId: "",
      model: Model.QICORE,
      draft: true,
      version: null,
      cqlErrors: false,
      publisher: "Org1",
      description: "testing",
      experimental: true,
      cql: "library UpdateName version '1.0.000'",
      createdAt: "",
      createdBy: "john doe",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    isUsingEmpty.mockClear().mockImplementation(() => false);
    mockedAxios.put.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cqlLibraryName: "UpdateName",
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

    const libraryNode = (await screen.getByTestId(
      "cql-library-name-text-field-input"
    )) as HTMLInputElement;
    expect(libraryNode.value).toBe("Library1");
    Simulate.change(libraryNode);

    userEvent.clear(libraryNode);
    userEvent.type(libraryNode, "UpdateName");
    Simulate.change(libraryNode);

    await waitFor(() => expect(libraryNode.value).toBe("UpdateName"));

    const experiementalChkBox = screen.getByRole("checkbox", {
      name: "Experimental",
    }) as HTMLInputElement;
    expect(experiementalChkBox.value).toBe("true");
    userEvent.click(experiementalChkBox);
    expect(experiementalChkBox.value).toBe("false");

    const publisher = screen.getByRole("combobox", {
      name: "Publisher",
    }) as HTMLInputElement;
    expect(publisher.value).toBe("Org1");
    fireEvent.keyDown(publisher, { key: "ArrowDown" });
    const anotherOrg = await screen.getByRole("option", { selected: false });
    userEvent.click(anotherOrg);
    expect(publisher.value).toBe("Org2");

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
      const successMessage = screen.getByTestId("generic-success-text-header");
      expect(successMessage.textContent).toEqual("CQL updated successfully");
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
    expect(mockedAxios.put.mock.lastCall[0]).toEqual(
      "/cql-libraries/cql-lib-1234"
    );
    expect(mockedAxios.put.mock.lastCall[1]).toBeTruthy();
  }, 10000);

  it("should render existing CQL in the editor", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      librarySetId: "",
      model: Model.QICORE,
      draft: true,
      version: null,
      cqlErrors: false,
      publisher: "Tester",
      description: "Testing stuff.",
      experimental: true,
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
      librarySetId: "",
      model: Model.QICORE,
      draft: true,
      version: null,
      cqlErrors: false,
      publisher: "Tester",
      description: "Testing stuff.",
      experimental: true,
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

  it("should render all fields in read-only mode when loaded library is not a draft", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      librarySetId: "",
      model: Model.QICORE,
      cqlErrors: false,
      draft: false,
      version: null,
      publisher: "Tester",
      description: "Testing stuff.",
      experimental: true,
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
    ).toHaveAttribute("disabled");
    expect(
      screen.getByRole("textbox", { name: "Description required" })
    ).toHaveAttribute("disabled");
    expect(screen.getByRole("combobox", { name: "Publisher" })).toBeDisabled();
    expect(
      screen.getByRole("checkbox", { name: "Experimental" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("should render organization list in publisher autocomplete", async () => {
    renderWithRouter();
    const publisher = await screen.findByRole("combobox", {
      name: "Publisher",
    });
    fireEvent.keyDown(publisher, { key: "ArrowDown" });
    const orgList = await screen.findAllByRole("option");
    expect(orgList).toHaveLength(2);
  });

  it("should render all fields in read-only mode if user is not the owner of the CQL Library", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return false;
    });
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      librarySetId: "",
      model: Model.QICORE,
      draft: true,
      version: null,
      publisher: "Tester",
      cqlErrors: false,
      description: "Testing stuff.",
      experimental: true,
      cql: "library testCql version '1.0.000'",
      createdAt: "",
      createdBy: "someone else",
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
        "You are not the owner of the CQL Library. Only owner can edit it."
      )
    ).toBeInTheDocument();

    expect(screen.getByTestId("cql-library-editor")).toHaveAttribute(
      "readonly"
    );
    expect(
      screen.getByTestId("cql-library-name-text-field-input")
    ).toHaveAttribute("disabled");
    expect(
      screen.getByRole("textbox", { name: "Description required" })
    ).toHaveAttribute("disabled");
    expect(screen.getByRole("combobox", { name: "Publisher" })).toBeDisabled();

    expect(
      screen.getByRole("checkbox", { name: "Experimental" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("should display validation error message for updating library", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      librarySetId: "",
      model: Model.QICORE,
      draft: true,
      version: null,
      cqlErrors: false,
      publisher: "Org1",
      description: "testing",
      experimental: true,
      cql: "library UpdateName version '1.0.000'",
      createdAt: "",
      createdBy: "john doe",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    isUsingEmpty.mockClear().mockImplementation(() => false);
    mockedAxios.put.mockRejectedValueOnce({
      response: {
        data: {
          message: "error",
          validationErrors: { cqlLibraryName: "validationError" },
        },
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

    const publisher = screen.getByRole("combobox", {
      name: "Publisher",
    }) as HTMLInputElement;
    expect(publisher.value).toBe("Org1");
    fireEvent.keyDown(publisher, { key: "ArrowDown" });
    const anotherOrg = await screen.getByRole("option", { selected: false });
    userEvent.click(anotherOrg);
    expect(publisher.value).toBe("Org2");

    const updateButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);
    await waitFor(() => {
      const errorMessage = screen.getByTestId("generic-error-text-header");
      expect(errorMessage.textContent).toEqual(
        "error cqlLibraryName : validationError"
      );
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
    expect(mockedAxios.put.mock.lastCall[0]).toEqual(
      "/cql-libraries/cql-lib-1234"
    );
    expect(mockedAxios.put.mock.lastCall[1]).toBeTruthy();
  });

  it("should display generic error message for updating library", async () => {
    const cqlLibrary: CqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      librarySetId: "",
      model: Model.QICORE,
      draft: true,
      version: null,
      cqlErrors: false,
      publisher: "Org1",
      description: "testing",
      experimental: true,
      cql: "library UpdateName version '1.0.000'",
      createdAt: "",
      createdBy: "john doe",
      lastModifiedAt: "",
      lastModifiedBy: "",
    };

    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: { ...cqlLibrary } });
    mockedAxios.put.mockClear();
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    isUsingEmpty.mockClear().mockImplementation(() => false);
    mockedAxios.put.mockRejectedValueOnce({
      error: "error",
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

    const publisher = screen.getByRole("combobox", {
      name: "Publisher",
    }) as HTMLInputElement;
    expect(publisher.value).toBe("Org1");
    fireEvent.keyDown(publisher, { key: "ArrowDown" });
    const anotherOrg = await screen.getByRole("option", { selected: false });
    userEvent.click(anotherOrg);
    expect(publisher.value).toBe("Org2");

    const updateButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);
    await waitFor(() => {
      const errorMessage = screen.getByTestId("generic-error-text-header");
      expect(errorMessage.textContent).toEqual(
        "An error occurred while updating the CQL library"
      );
      expect(mockedAxios.put).toHaveBeenCalledTimes(1);
    });
    expect(mockedAxios.put.mock.lastCall[0]).toEqual(
      "/cql-libraries/cql-lib-1234"
    );
    expect(mockedAxios.put.mock.lastCall[1]).toBeTruthy();
  });
});
