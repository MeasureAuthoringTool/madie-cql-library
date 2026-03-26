import * as React from "react";
import {
  fireEvent,
  render,
  waitFor,
  screen,
  within,
} from "@testing-library/react";
import { CqlLibrary, Model } from "@madie/madie-models";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { act, Simulate } from "react-dom/test-utils";
import {
  ElmTranslationExternalError,
  isUsingEmpty,
  synchingEditorCqlContent,
  validateContent,
} from "@madie/madie-editor";
import {
  checkUserCanEdit,
  UserServiceApi,
  useCqlLibraryServiceApi,
  CqlLibraryServiceApi,
} from "@madie/madie-util";
import { routesConfig } from "../cqlLibraryRoutes/CqlLibraryRoutes";
import {
  TRANSFER_LIBRARY_FAILURE,
  TRANSFER_LIBRARY_SUCCESS,
} from "../cqlLibraryList/CqlLibraryList";
import { INVALID_HARP_ID_MESSAGE } from "../common/transferDialog/TransferDialog";

const { getByTestId, queryByTestId, queryByText } = screen;
const mockUserServiceApi = {
  getOwnerDetails: jest.fn().mockResolvedValue({}),
} as unknown as UserServiceApi;
jest.mock("@madie/madie-util", () => ({
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  useOktaTokens: jest.fn(() => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  })),
  useDocumentTitle: jest.fn(),
  useFeatureFlags: jest.fn(() => ({})),
  useUserRoles: jest.fn(() => ({})),
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
  useUserServiceApi: jest.fn(() => mockUserServiceApi),
  useCqlLibraryServiceApi: jest.fn(() => mockCqlLibraryServiceApi),
}));

const cqlLibrary = {
  id: "cql-lib-1234",
  cqlLibraryName: "Library1",
  librarySetId: "",
  model: Model.QICORE,
  cqlErrors: false,
  cql: "test cql",
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

const draftedLibrary = {
  id: "cql-lib-1256",
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

const lockInfo = {
  isLocked: false,
  locedBy: null,
};
const makeMockhistory = (number: number) => {
  const mockHistory = [];
  for (let i = 0; i < number; i++) {
    mockHistory.push({
      actionType: `action type ${i}`,
      additionalActionMessage: `message ${i}`,
      performedAt: `performed at ${i}`,
      performedBy: `performed by ${i}`,
    });
  }
  return mockHistory;
};
const mockCqlLibraryServiceApi = {
  createDraft: jest.fn().mockResolvedValue(draftedLibrary),
  lockLibrary: jest.fn().mockResolvedValue({ data: lockInfo }),
  unlockLibrary: jest.fn().mockResolvedValue({ data: lockInfo }),
  createVersion: jest
    .fn()
    .mockResolvedValue({ data: { ...cqlLibrary, version: "newVersion" } }),
  deleteDraft: jest.fn().mockResolvedValue({ data: draftedLibrary }),
  getLibraryHistory: jest.fn().mockResolvedValue(makeMockhistory(50)),
  transferLibraries: jest.fn().mockResolvedValue({
    status: 200,
    data: [],
  }),
  fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary), // <-- added fetchCqlLibrary mock
  updateCqlLibrary: jest.fn().mockResolvedValue({
    data: {
      ...cqlLibrary,
      cqlLibraryName: "UpdatedName",
      cql: synchingEditorCqlContent,
    },
  }),
  deleteCqlLibrary: jest.fn().mockResolvedValue({}),
} as unknown as CqlLibraryServiceApi;

const mockLocation = jest.fn();
const mockPush = jest.fn();
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockPush,
  useLocation: () => mockLocation,
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
} as unknown as ServiceConfig;

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
    draft: true,
  },
];

jest.mock("../../hooks/useOktaTokens", () =>
  jest.fn(() => ({
    getAccessToken: () => "test.jwt",
  }))
);

const renderWithRouter = (
  initialEntries = [{ pathname: "/cql-libraries/cql-lib-1234/edit/details" }]
) => {
  const router = createMemoryRouter(routesConfig, {
    initialEntries,
  });
  render(
    <ApiContextProvider value={serviceConfig}>
      <RouterProvider router={router} />
    </ApiContextProvider>
  );
};

describe("Edit Cql Library Component", () => {
  beforeEach(() => {
    mockCqlLibraryServiceApi.createDraft = jest
      .fn()
      .mockResolvedValue(draftedLibrary);

    mockCqlLibraryServiceApi.lockLibrary = jest
      .fn()
      .mockResolvedValue({ data: lockInfo });
    mockCqlLibraryServiceApi.unlockLibrary = jest
      .fn()
      .mockResolvedValue({ data: lockInfo });
    mockCqlLibraryServiceApi.getLibraryHistory = jest
      .fn()
      .mockResolvedValue(makeMockhistory(50));

    global.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    mockCqlLibraryServiceApi.fetchCqlLibrary = jest
      .fn()
      .mockResolvedValue(cqlLibrary);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render form and cql library editor", () => {
    renderWithRouter();
    const cqlLibraryEditor = screen.getByTestId("cql-library-editor-component");
    const form = getByTestId("edit-library-form");
    const input = getByTestId("cql-library-editor") as HTMLInputElement;
    expect(form).toBeInTheDocument();
    expect(cqlLibraryEditor).toBeInTheDocument();
    expect(input.value).toEqual("");
  });

  it("should generate field level error for required Cql Library name", async () => {
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValueOnce({
      ...cqlLibrary,
      model: Model.QDM_5_6,
    });
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
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
    });
  });

  it("should have Save button disabled until form is valid and dirty", async () => {
    renderWithRouter();
    let input;
    await waitFor(() => {
      input = getByTestId(
        "cql-library-name-text-field-input"
      ) as HTMLInputElement;
    });
    expect(input.value).toBe("Library1");
    expect(
      screen.getByRole("button", {
        name: "Save",
      })
    ).toBeDisabled();
    userEvent.clear(input);
    expect(input.value).toBe("");
    userEvent.type(input, "TestinglibraryName12");
    expect(input.value).toBe("TestinglibraryName12");
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
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();
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

  it("should display a draft dialog when the event is triggered", async () => {
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();
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
    act(() => {
      window.dispatchEvent(new Event("draft-library"));
    });
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();
    const cancelButton = await screen.findByTestId(
      "create-draft-cancel-button"
    );
    userEvent.click(cancelButton);
    await waitFor(() => {
      expect(screen.queryByText("Create Draft")).not.toBeVisible();
    });
  });

  it("should display a delete dialog when the event is triggered", async () => {
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();
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
    act(() => {
      window.dispatchEvent(new Event("delete-library"));
    });
    expect(
      await screen.findByText("Delete draft of Library1?")
    ).toBeInTheDocument();
    const cancelButton = await screen.findByTestId(
      "delete-dialog-cancel-button"
    );
    userEvent.click(cancelButton);
    await waitFor(() => {
      expect(screen.queryByText("Delete draft of Library1?")).not.toBeVisible();
    });
  });

  it("should display a delete dialog when the event is triggered and delete succeeds", async () => {
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();
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
    act(() => {
      window.dispatchEvent(new Event("delete-library"));
    });
    expect(
      await screen.findByText("Delete draft of Library1?")
    ).toBeInTheDocument();
    const continueButton = await screen.findByTestId(
      "delete-dialog-continue-button"
    );
    userEvent.click(continueButton);
  });

  it("should display an error when existing cql library cannot be loaded", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibrary.mockRejectedValue({
      response: {
        data: {
          message: "Test error!!",
        },
      },
    });
    renderWithRouter();

    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();

    expect(
      screen.getByText("An error occurred while fetching the CQL Library!")
    ).toBeInTheDocument();
  });

  it("should prevent update when cql library cannot be loaded", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibrary.mockRejectedValue({
      response: {
        data: {
          message: "Test error!!",
        },
      },
    });
    renderWithRouter();

    const updateButton1 = await screen.findByRole("button", {
      name: "Save",
    });

    expect(updateButton1).toBeInTheDocument();
    expect(updateButton1).toBeDisabled();

    expect(
      screen.getByText("An error occurred while fetching the CQL Library!")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("textbox", { name: "CQL Library Name" })
    ).toHaveAttribute("readonly");
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
    mockCqlLibraryServiceApi.updateCqlLibrary.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cqlLibraryName: "UpdatedName",
        cql: synchingEditorCqlContent,
      },
    });
    renderWithRouter();

    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

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
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("test cql");

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
      expect(updateButton).not.toBeInTheDocument();
    });
  });

  it("should update an existing cql library with the updated cql library name, version and warn about blank using", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library UpdateName version '1.0.000'",
        };
      });

    isUsingEmpty.mockClear().mockImplementation(() => true);

    mockCqlLibraryServiceApi.updateCqlLibrary.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cqlLibraryName: "UpdatedName",
        cql: synchingEditorCqlContent,
      },
    });

    renderWithRouter();

    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

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
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("test cql");

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
      expect(updateButton).not.toBeInTheDocument();
    });
  });

  it("should update an existing cql library with the upated FhirHerlpers Alias and warn ", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql: "library UpdateName version '1.0.000' include FHIRHelers version '4.3.000' called Dummy",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isFhirHelpersAliasChanged: true,
          isValueSetChanged: false,
        };
      });

    isUsingEmpty.mockClear().mockImplementation(() => true);

    mockCqlLibraryServiceApi.updateCqlLibrary.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cqlLibraryName: "UpdatedName",
        cql: synchingEditorCqlContent,
      },
    });

    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

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
    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("test cql");

    fireEvent.change(screen.getByTestId("cql-library-editor"), {
      target: {
        value:
          "library UpdateName version '1.0.000' include FHIRHelers version '4.3.000' called Dummmy",
      },
    });

    const updateButton = screen.getByRole("button", {
      name: "Save",
    });
    expect(updateButton).not.toBeDisabled();
    userEvent.click(updateButton);
    await waitFor(() => {
      expect(updateButton).not.toBeInTheDocument();
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

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    isUsingEmpty.mockClear().mockImplementation(() => false);
    mockCqlLibraryServiceApi.updateCqlLibrary.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cqlLibraryName: "UpdateName",
        cql: "library UpdateName version '1.0.000'",
      },
    });
    renderWithRouter();

    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

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
      expect(updateButton).not.toBeInTheDocument();
    });
    expect(mockCqlLibraryServiceApi.updateCqlLibrary).toHaveBeenCalled();
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

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });

    renderWithRouter();

    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", { name: "Save" })
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
    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });

    // mock validateContent before rendering so component uses the mocked result
    (validateContent as jest.Mock).mockClear().mockImplementation(() => {
      return Promise.resolve({
        errors: [],
        externalErrors: cqlToElmExternalErrors,
      });
    });

    renderWithRouter();

    const toastMessage = await screen.findByText(
      cqlToElmExternalErrors[0].message
    );
    expect(toastMessage).toBeInTheDocument();
  });

  it("should render all fields in read-only mode when loaded library is not a draft", async () => {
    const cqlLibrary = {
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
    } as unknown as CqlLibrary;

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    renderWithRouter();

    expect(
      await screen.findByText(
        "CQL Library is not a draft. Only drafts can be edited."
      )
    ).toBeInTheDocument();

    expect(screen.getByTestId("cql-library-editor")).toHaveAttribute(
      "readonly"
    );
    expect(
      screen.getByRole("textbox", { name: "CQL Library Name" })
    ).toHaveAttribute("readonly");
    expect(
      screen.getByRole("textbox", { name: "Description" })
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "Publisher" })).toHaveAttribute(
      "readonly"
    );
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
    mockUserServiceApi.getOwnerDetails.mockRejectedValueOnce(new Error("fail"));

    const cqlLibrary = {
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
    } as unknown as CqlLibrary;

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    renderWithRouter();
    expect(
      await screen.findByText(
        "You are not the owner of the CQL Library. Only owner can edit it."
      )
    ).toBeInTheDocument();

    expect(screen.getByTestId("cql-library-editor")).toHaveAttribute(
      "readonly"
    );
    expect(
      screen.getByRole("textbox", { name: "CQL Library Name" })
    ).toHaveAttribute("readonly");
    expect(
      screen.getByRole("textbox", { name: "Description" })
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "Publisher" })).toHaveAttribute(
      "readonly"
    );
    expect(
      screen.getByRole("textbox", { name: "Library Owner" })
    ).toHaveAttribute("readonly");
    expect(
      (screen.getByTestId("library-owner-text-field") as HTMLInputElement).value
    ).toBe("-");

    expect(
      screen.getByRole("checkbox", { name: "Experimental" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("should display validation error message for updating library", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    const cqlLibrary = {
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
    } as unknown as CqlLibrary;

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    isUsingEmpty.mockClear().mockImplementation(() => false);

    mockCqlLibraryServiceApi.lockLibrary.mockResolvedValue({ data: lockInfo });
    mockCqlLibraryServiceApi.updateCqlLibrary.mockRejectedValue({
      response: {
        data: {
          message: "error",
          validationErrors: { cqlLibraryName: "validationError" },
        },
      },
    });
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

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
      expect(mockCqlLibraryServiceApi.updateCqlLibrary).toHaveBeenCalledTimes(
        1
      );
    });
    expect(mockCqlLibraryServiceApi.updateCqlLibrary.mock.lastCall[0]).toEqual({
      cql: undefined,
      cqlErrors: false,
      cqlLibraryName: "Library1",
      description: "testing",
      draft: true,
      experimental: true,
      id: "cql-lib-1234",
      librarySet: undefined,
      librarySetId: "",
      model: "QI-Core v4.1.1",
      publisher: "Org2",
    });
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

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    isUsingEmpty.mockClear().mockImplementation(() => false);
    mockCqlLibraryServiceApi.lockLibrary.mockResolvedValue({ data: lockInfo });
    mockCqlLibraryServiceApi.updateCqlLibrary.mockRejectedValue({
      response: {
        data: {
          error: "error",
        },
      },
    });
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

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
        "Issues were found within the CQL"
      );
      expect(mockCqlLibraryServiceApi.updateCqlLibrary).toHaveBeenCalledTimes(
        1
      );
    });
  });

  it("should display a version dialog when the event is triggered", async () => {
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();
    const input = (await screen.getByTestId(
      "cql-library-name-text-field-input"
    )) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("Library1");
    act(() => {
      window.dispatchEvent(new Event("version-library"));
    });
    expect(await screen.findByText("Create Version")).toBeInTheDocument();
    const cancelButton = await screen.findByTestId(
      "create-version-cancel-button"
    );
    userEvent.click(cancelButton);
    await waitFor(() => {
      expect(screen.queryByText("Create Version")).not.toBeVisible();
    });
  });

  it("should create a draft measure when the draft event is triggered", async () => {
    renderWithRouter();
    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();
    const input = (await screen.getByTestId(
      "cql-library-name-text-field-input"
    )) as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe("Library1");
    act(() => {
      window.dispatchEvent(new Event("draft-library"));
    });
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();
    const continueButton = await screen.findByTestId(
      "create-draft-continue-button"
    );
    userEvent.click(continueButton);
    await waitFor(() => {
      const successMessage = screen.getByTestId("generic-success-text-header");
      expect(successMessage.textContent).toEqual(
        "New Draft of CQL Library is Successfully created"
      );
    });
  });
  it("should render library history.", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    mockCqlLibraryServiceApi.getLibraryHistory.mockResolvedValue(
      makeMockhistory(50)
    );

    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
    });

    act(() => {
      window.dispatchEvent(new Event("history-library"));
    });
    expect(await screen.findByText("Library History")).toBeInTheDocument();
    const closeButton = screen.getByTestId("close-button");
    act(() => {
      userEvent.click(closeButton);
    });
    await waitFor(() =>
      expect(screen.queryByTestId("close-button")).not.toBeInTheDocument()
    );
  });
  it("should render library history with smaller items than page.", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    mockCqlLibraryServiceApi.getLibraryHistory.mockResolvedValue(
      makeMockhistory(3)
    );
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();
    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(
        screen.getByTestId("cql-library-name-text-field-input")
      ).not.toHaveAttribute("disabled");
    });

    act(() => {
      window.dispatchEvent(new Event("history-library"));
    });
    expect(await screen.findByText("Library History")).toBeInTheDocument();
    const closeButton = screen.getByTestId("close-button");
    act(() => {
      userEvent.click(closeButton);
    });
    await waitFor(() =>
      expect(screen.queryByTestId("close-button")).not.toBeInTheDocument()
    );
  });

  it("should remove concept successfully", async () => {
    (synchingEditorCqlContent as jest.Mock)
      .mockClear()
      .mockImplementation(() => {
        return {
          cql:
            "library RemoveConceptTest version '0.0.000'\n" +
            "\n" +
            "using QICore version '4.1.1'\n",
          isLibraryStatementChanged: false,
          isUsingStatementChanged: false,
          isValueSetChanged: false,
          isConceptRemoved: true,
        };
      });
    isUsingEmpty.mockClear().mockImplementation(() => false);
    mockCqlLibraryServiceApi.updateCqlLibrary.mockResolvedValue({
      data: {
        ...cqlLibrary,
        cql:
          "library RemoveConceptTest version '0.0.000'\n" +
          "\n" +
          "using QICore version '4.1.1'\n",
        // component expects a success path with warning — include message used by assertions
        message: "CQL updated successfully but the following issues were found",
      },
    });
    renderWithRouter();

    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

    expect(
      await screen.findByRole("button", {
        name: "Save",
      })
    ).toBeInTheDocument();

    const input = screen.getByTestId("cql-library-editor") as HTMLInputElement;
    expect(input).toHaveValue("test cql");

    fireEvent.change(screen.getByTestId("cql-library-editor"), {
      target: {
        value:
          "library RemoveConceptTest version '0.0.000'\n" +
          "\n" +
          "using QICore version '4.1.1'\n" +
          "\n" +
          'concept "Type B Hepatitis": { "Hepatitis Type B (SNOMED)", "Hepatitis Type B (ICD-10)" } display \'Type B Hepatitis\'\n',
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
      "Concept Constructs are not supported in MADiE. It has been removed."
    );
  });

  it("should lock library if feature flag is on and user can edit library", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });

    mockCqlLibraryServiceApi.lockLibrary.mockResolvedValue({ data: lockInfo });
    mockCqlLibraryServiceApi.unlockLibrary.mockResolvedValue({
      data: lockInfo,
    });

    renderWithRouter();
    expect(mockCqlLibraryServiceApi.lockLibrary).toHaveBeenCalledWith(
      "cql-lib-1234"
    );
  });

  it("should not lock library if user can not edit library", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return false;
    });

    renderWithRouter();
    expect(mockCqlLibraryServiceApi.lockLibrary).not.toHaveBeenCalledWith(
      "cql-lib-1234"
    );
  });

  it("should call createVersion and show success message when versioning", async () => {
    renderWithRouter();

    // Trigger the version dialog
    act(() => {
      window.dispatchEvent(new Event("version-library"));
    });

    const majorRadio = await screen.findByLabelText("Major");
    fireEvent.click(majorRadio);

    const continueButton = screen.getByTestId("create-version-continue-button");
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("generic-success-text-header").textContent
      ).toBe("New version of CQL Library is Successfully created.");
    });
  });

  it("should call createVersion and show error message when versioning fails with 423", async () => {
    mockCqlLibraryServiceApi.createVersion.mockRejectedValueOnce({
      response: {
        data: {
          status: 423,
          message:
            "Unable to version measure. Locked while being edited by anotherUser.",
        },
      },
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("version-library"));
    });

    const majorRadio = await screen.findByLabelText("Major");
    fireEvent.click(majorRadio);

    const continueButton = screen.getByTestId("create-version-continue-button");
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("edit-library-cql-generic-error-text").textContent
      ).toBe(
        "Unable to version measure. Locked while being edited by anotherUser."
      );
    });
    // Close the error message
    const closeBtn = screen.getByTestId("ClearIcon");
    fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(
        screen.queryByTestId("generic-success-text-header")
      ).not.toBeInTheDocument();
    });
  });

  it("should call createVersion and show error message when versioning fails with error other than 423", async () => {
    mockCqlLibraryServiceApi.createVersion.mockRejectedValueOnce({
      response: {
        data: {
          status: 400,
          error: "Bad Request",
          message:
            "Problem creating version for CQL Library due to some error.",
        },
      },
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("version-library"));
    });

    const majorRadio = await screen.findByLabelText("Major");
    fireEvent.click(majorRadio);

    const continueButton = screen.getByTestId("create-version-continue-button");
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("edit-library-cql-generic-error-text").textContent
      ).toBe(
        "400: Bad Request Problem creating version for CQL Library due to some error."
      );
    });
  });

  it("should call createVersion and show error message when versioning fails with just error no response.data", async () => {
    mockCqlLibraryServiceApi.createVersion.mockRejectedValueOnce({
      error: "error",
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("version-library"));
    });

    const majorRadio = await screen.findByLabelText("Major");
    fireEvent.click(majorRadio);

    const continueButton = screen.getByTestId("create-version-continue-button");
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createVersion).toHaveBeenCalledTimes(1);
    });
  });

  it("handle delete library", async () => {
    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("delete-library"));
    });
    expect(
      await screen.findByText("Delete draft of Library1?")
    ).toBeInTheDocument();
    const continueButton = await screen.findByTestId(
      "delete-dialog-continue-button"
    );
    userEvent.click(continueButton);
    await waitFor(() => {
      const successMessage = screen.getByTestId("generic-success-text-header");
      expect(successMessage.textContent).toEqual(
        "The Draft CQL Library has been deleted."
      );
    });
  });

  it("handle delete draft library failure of 400", async () => {
    mockCqlLibraryServiceApi.deleteDraft.mockRejectedValueOnce({
      response: {
        data: {
          status: 400,
          error: "Bad Request",
          message: "Problem deleting CQL Library due to some error.",
        },
      },
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("delete-library"));
    });
    expect(
      await screen.findByText("Delete draft of Library1?")
    ).toBeInTheDocument();
    const continueButton = await screen.findByTestId(
      "delete-dialog-continue-button"
    );
    userEvent.click(continueButton);
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.deleteDraft).toHaveBeenCalledTimes(1);
    });
  });

  it("delete draft library failure with no response.data", async () => {
    mockCqlLibraryServiceApi.deleteDraft.mockRejectedValueOnce({
      error: "error",
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("delete-library"));
    });
    expect(
      await screen.findByText("Delete draft of Library1?")
    ).toBeInTheDocument();
    const continueButton = await screen.findByTestId(
      "delete-dialog-continue-button"
    );
    userEvent.click(continueButton);
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.deleteDraft).toHaveBeenCalledTimes(1);
    });
  });

  it("handle create draft error 400", async () => {
    mockCqlLibraryServiceApi.createDraft.mockRejectedValueOnce({
      response: {
        data: {
          status: 400,
          error: "Bad Request",
          message: "Problem creating draft for CQL Library due to some error.",
        },
      },
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("draft-library"));
    });
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();

    const modelSelect = await screen.getByTestId("cql-library-model-select");
    const modelSelectComboBox = await within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(2);
    userEvent.click(options[0]);

    const continueButton = await screen.findByTestId(
      "create-draft-continue-button"
    );

    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createDraft).toHaveBeenCalledTimes(1);
    });
  });

  it("handle create draft error 403", async () => {
    mockCqlLibraryServiceApi.createDraft.mockRejectedValueOnce({
      response: {
        data: {
          status: 403,
          error: "Forbidden",
          message:
            "User is unauthorized to create a draft for this CQL Library.",
        },
      },
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("draft-library"));
    });
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();

    const modelSelect = await screen.getByTestId("cql-library-model-select");
    const modelSelectComboBox = await within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(2);
    userEvent.click(options[0]);

    const continueButton = await screen.findByTestId(
      "create-draft-continue-button"
    );

    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createDraft).toHaveBeenCalledTimes(1);
    });
  });

  it("handle create draft other error", async () => {
    mockCqlLibraryServiceApi.createDraft.mockRejectedValueOnce({
      esponse: {
        data: {
          status: 500,
          error: "Internal Server Error",
          message:
            "An unexpected error occurred while creating a draft for this CQL Library.",
        },
      },
    });

    renderWithRouter();

    act(() => {
      window.dispatchEvent(new Event("draft-library"));
    });
    expect(await screen.findByText("Create Draft")).toBeInTheDocument();

    const modelSelect = await screen.getByTestId("cql-library-model-select");
    const modelSelectComboBox = await within(modelSelect).getByRole("combobox");
    userEvent.click(modelSelectComboBox);
    const options = await screen.findAllByRole("option");
    expect(options.length).toEqual(2);
    userEvent.click(options[0]);

    const continueButton = await screen.findByTestId(
      "create-draft-continue-button"
    );

    userEvent.click(continueButton);

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createDraft).toHaveBeenCalledTimes(1);
    });
  });

  it("should open transfer dialog and show success message when transferring library", async () => {
    mockCqlLibraryServiceApi.transferLibraries.mockResolvedValueOnce({
      status: 200,
      data: [],
    });

    renderWithRouter();

    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-library"));
    });

    const transferDialog = await screen.findByTestId("transfer-dialog");
    expect(transferDialog).toBeInTheDocument();

    const transferSaveButton = screen.getByTestId("transfer-save-button");
    expect(transferSaveButton).toBeDisabled();

    const newHarpIdInput = screen.getByTestId("harp-id-input");
    fireEvent.change(newHarpIdInput, { target: { value: "newUser" } });

    expect(transferSaveButton).toBeEnabled();

    fireEvent.click(transferSaveButton);

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.transferLibraries).toHaveBeenCalledTimes(
        1
      );
    });

    expect(mockCqlLibraryServiceApi.transferLibraries).toHaveBeenCalledWith(
      ["cql-lib-1234"],
      "newUser",
      false
    );

    await waitFor(() => {
      expect(screen.getByText(TRANSFER_LIBRARY_SUCCESS)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("transfer-dialog")).not.toBeInTheDocument();
    });
  });

  it("should show warning message when transfer returns 207 with failed libraries", async () => {
    mockCqlLibraryServiceApi.transferLibraries.mockResolvedValueOnce({
      status: 207,
      data: ["cql-lib-1234"],
    });

    renderWithRouter();

    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-library"));
    });

    const transferDialog = await screen.findByTestId("transfer-dialog");
    expect(transferDialog).toBeInTheDocument();

    const harpInput = screen.getByTestId("harp-id-input");
    fireEvent.change(harpInput, { target: { value: "newUser" } });

    const transferButton = screen.getByTestId("transfer-save-button");
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.transferLibraries).toHaveBeenCalledTimes(
        1
      );
      expect(mockCqlLibraryServiceApi.transferLibraries).toHaveBeenCalledWith(
        ["cql-lib-1234"],
        "newUser",
        false
      );
    });

    const warningHeader = await screen.findByTestId(
      "generic-warning-text-header"
    );
    expect(warningHeader).toBeInTheDocument();
    expect(warningHeader).toHaveTextContent(
      "This Library could not be transferred. Please try again, or contact help desk if the issue persists."
    );

    const failedLibrary = screen.getByTestId("library-warning");
    expect(failedLibrary).toHaveTextContent("Library1");

    await waitFor(() => {
      expect(screen.queryByTestId("transfer-dialog")).not.toBeInTheDocument();
    });
  });

  it("should show error toast when transfer fails", async () => {
    mockCqlLibraryServiceApi.transferLibraries.mockRejectedValueOnce(
      new Error("Network Error")
    );

    renderWithRouter();

    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-library"));
    });

    const transferDialog = await screen.findByTestId("transfer-dialog");
    expect(transferDialog).toBeInTheDocument();

    const harpInput = screen.getByTestId("harp-id-input");
    fireEvent.change(harpInput, { target: { value: "newUser" } });

    const transferButton = screen.getByTestId("transfer-save-button");
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.transferLibraries).toHaveBeenCalledTimes(
        1
      );
      expect(mockCqlLibraryServiceApi.transferLibraries).toHaveBeenCalledWith(
        ["cql-lib-1234"],
        "newUser",
        false
      );
    });

    await waitFor(() => {
      expect(screen.getByText(TRANSFER_LIBRARY_FAILURE)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.queryByTestId("transfer-dialog")).not.toBeInTheDocument();
    });
  });

  it("should display field-level error and not close dialog when transfer returns 400 with invalid HARP ID", async () => {
    mockCqlLibraryServiceApi.transferLibraries.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { message: INVALID_HARP_ID_MESSAGE },
      },
    });

    renderWithRouter();

    expect(
      await screen.findByRole("button", { name: "Save" })
    ).toBeInTheDocument();

    act(() => {
      window.dispatchEvent(new Event("transfer-library"));
    });

    const transferDialog = await screen.findByTestId("transfer-dialog");
    expect(transferDialog).toBeInTheDocument();

    const harpInput = screen.getByTestId("harp-id-input");
    fireEvent.change(harpInput, { target: { value: "invalidUser" } });

    const transferButton = screen.getByTestId("transfer-save-button");
    fireEvent.click(transferButton);

    await waitFor(() => {
      expect(screen.getByText(INVALID_HARP_ID_MESSAGE)).toBeInTheDocument();
      expect(screen.getByTestId("transfer-dialog")).toBeInTheDocument();
    });
  });

  it("should render all fields in read-only mode if the CQL Library is locked by another user", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });
    const cqlLibrary = {
      id: "cql-lib-1234",
      cqlLibraryName: "Library1",
      model: Model.QICORE,
      draft: true,
      cqlErrors: false,
      description: "Testing stuff.",
      cql: "library testCql version '1.0.000'",
      cqlLibraryLock: {
        lockedBy: "anotherUser",
      },
    } as unknown as CqlLibrary;

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    renderWithRouter();

    expect(screen.getByTestId("cql-library-editor")).toHaveAttribute(
      "readonly"
    );
    expect(
      screen.getByRole("textbox", { name: "CQL Library Name" })
    ).toHaveAttribute("readonly");
    expect(
      screen.getByRole("textbox", { name: "Description" })
    ).toHaveAttribute("readonly");
    expect(screen.getByRole("textbox", { name: "Publisher" })).toHaveAttribute(
      "readonly"
    );

    expect(
      screen.getByRole("checkbox", { name: "Experimental" })
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("Should display error when cql library is locked while updating", async () => {
    (checkUserCanEdit as jest.Mock).mockImplementation(() => {
      return true;
    });

    const cqlLibrary = {
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
    } as unknown as CqlLibrary;

    mockCqlLibraryServiceApi.fetchCqlLibrary.mockResolvedValue({
      ...cqlLibrary,
    });
    (synchingEditorCqlContent as jest.Mock).mockImplementation(() => {
      return "library UpdateName version '1.0.000'";
    });
    isUsingEmpty.mockClear().mockImplementation(() => false);
    mockCqlLibraryServiceApi.lockLibrary.mockRejectedValueOnce({
      response: {
        data: {
          status: 423,
          message:
            "Unable to update Cql Library. Cql Library is locked by: anotherUser",
        },
      },
    });
    renderWithRouter();
    expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toHaveBeenCalled();

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
    expect(mockCqlLibraryServiceApi.lockLibrary).toHaveBeenCalledWith(
      "cql-lib-1234"
    );
  });
});
