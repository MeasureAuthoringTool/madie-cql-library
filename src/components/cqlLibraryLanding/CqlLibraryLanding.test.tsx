// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required
import * as React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import { CqlLibraryServiceApi } from "../../api/useCqlLibraryServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import { Model, OwnershipType } from "@madie/madie-models";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import { useFeatureFlags } from "@madie/madie-util";
import {
  useNavigate,
  createMemoryRouter,
  RouterProvider,
} from "react-router-dom";
import { AxiosError, AxiosResponse } from "axios";
import { routesConfig } from "../cqlLibraryRoutes/CqlLibraryRoutes";

const abortController = new AbortController();

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
    getUserName: () => "test user",
  }),
  checkUserCanEdit: jest.fn(() => {
    return true;
  }),
  checkUserCanDelete: jest.fn(() => {
    return true;
  }),
  useOrganizationApi: jest.fn(() => ({
    getAllOrganizations: jest.fn().mockResolvedValue(organizations),
  })),
  useFeatureFlags: jest.fn().mockReturnValue({
    qdm: false,
  }),
}));
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
  terminologyService: {
    baseUrl: "example-terminology-url",
  },
};

jest.mock("../../hooks/useOktaTokens", () => () => ({
  getAccessToken: () => "test.jwt",
}));
const cqlLibrary = [
  {
    id: "622e1f46d1fd3729d861e6cb",
    cqlLibraryName: "TestCqlLibrary1",
    model: Model.QICORE,
    createdAt: null,
    createdBy: null,
    lastModifiedAt: null,
    lastModifiedBy: null,
    draft: true,
    cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
  },
];
const library2 = {
  id: "622e1f46d1fd3729d861e7cb",
  cqlLibraryName: "TestCqlLibrary2",
  model: Model.QICORE,
  createdAt: null,
  createdBy: null,
  lastModifiedAt: null,
  lastModifiedBy: null,
};

const generatePages = (count = 48) => {
  let libraries: any[] = [];
  libraries.push(cqlLibrary[0]);
  libraries.push(library2);
  for (let i = 1; i <= count; i++) {
    libraries.push({
      ...cqlLibrary[0], // Spread the existing object
      cqlLibraryName: `test-library-${i}`,
      id: `test-library-${i}`,
    });
  }
  return libraries;
};
const pageOf50 = generatePages(47);
const mockPageableVal = {
  content: pageOf50,
  totalPages: 1,
  totalElements: 10,
  numberOfElements: 50,
  pageable: { offset: 0 },
};

const mockCqlLibraryServiceApi = {
  fetchCqlLibraries: jest.fn().mockResolvedValue({ mockPageableVal }),
  fetchCqlLibrary: jest.fn().mockResolvedValue(cqlLibrary[0]),
  deleteDraft: jest.fn().mockResolvedValue({ data: "test" }),
  createDraft: jest.fn().mockResolvedValue({ data: "test" }),
  fetchAllOwners: jest.fn().mockResolvedValue(["owner1", "owner2"]),
  getLibrariesByLibrarySetId: jest.fn().mockResolvedValue([]),
} as unknown as CqlLibraryServiceApi;

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));
jest.mock("../../api/useCqlLibraryServiceApi", () =>
  jest.fn(() => mockCqlLibraryServiceApi)
);
jest.setTimeout(10000);
describe("Cql Library Page", () => {
  let mockNavigate: jest.Mock;
  beforeEach(() => {
    mockNavigate = jest.fn();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useFeatureFlags as jest.Mock).mockReturnValue({
      TestCaseListActionCenter: true,
      CopyTestCases: true,
    });
    localStorage.clear();
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  const renderWithRouter = (
    initialEntries = [{ pathname: "/cql-libraries" }]
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

  test("shows Owned Libraries on page load", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    const [cqlLibrary1Model] = await screen.findAllByText("QI-Core v4.1.1");
    expect(cqlLibrary1Model).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      OwnershipType.OWNED,
      10,
      0,
      { optionalSearchProperties: [], searchField: "" },
      "",
      abortController.signal
    );
    const ownedLibrariesTab = screen.getByTestId("owned-libraries-tab");
    expect(ownedLibrariesTab).toBeInTheDocument();
    expect(ownedLibrariesTab).toHaveClass("Mui-selected");

    const sharedLibrariesTab = screen.getByTestId("shared-libraries-tab");
    expect(sharedLibrariesTab).toBeInTheDocument();
    expect(sharedLibrariesTab).not.toHaveClass("Mui-selected");

    const allLibrariesTab = screen.getByTestId("all-libraries-tab");
    expect(allLibrariesTab).toBeInTheDocument();
    expect(allLibrariesTab).not.toHaveClass("Mui-selected");
  });

  test("navigate between Owned Libraries tab, Shared Libraries tab, and All Libraries tab", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);

    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      OwnershipType.OWNED,
      10,
      0,
      { optionalSearchProperties: [], searchField: "" },
      "",
      abortController.signal
    );

    const ownedLibrariesTab = screen.getByTestId("owned-libraries-tab");
    const sharedLibrariesTab = screen.getByTestId("shared-libraries-tab");
    const allLibrariesTab = screen.getByTestId("all-libraries-tab");

    expect(ownedLibrariesTab).toHaveClass("Mui-selected");
    expect(sharedLibrariesTab).not.toHaveClass("Mui-selected");
    expect(allLibrariesTab).not.toHaveClass("Mui-selected");

    // Click Shared tab
    await userEvent.click(sharedLibrariesTab);

    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenLastCalledWith(
      OwnershipType.SHARED,
      10,
      0,
      { optionalSearchProperties: [], searchField: "" },
      "",
      expect.any(AbortSignal)
    );

    expect(ownedLibrariesTab).not.toHaveClass("Mui-selected");
    expect(sharedLibrariesTab).toHaveClass("Mui-selected");
    expect(allLibrariesTab).not.toHaveClass("Mui-selected");

    // Click All tab
    await userEvent.click(allLibrariesTab);

    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenLastCalledWith(
      OwnershipType.ALL,
      10,
      0,
      { optionalSearchProperties: [], searchField: "" },
      "",
      expect.any(AbortSignal)
    );

    expect(ownedLibrariesTab).not.toHaveClass("Mui-selected");
    expect(sharedLibrariesTab).not.toHaveClass("Mui-selected");
    expect(allLibrariesTab).toHaveClass("Mui-selected");

    // Click Owned tab again
    await userEvent.click(ownedLibrariesTab);

    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenLastCalledWith(
      OwnershipType.OWNED,
      10,
      0,
      { optionalSearchProperties: [], searchField: "" },
      "",
      expect.any(AbortSignal)
    );

    expect(ownedLibrariesTab).toHaveClass("Mui-selected");
    expect(sharedLibrariesTab).not.toHaveClass("Mui-selected");
    expect(allLibrariesTab).not.toHaveClass("Mui-selected");
  });

  test("Should trigger onClick sort", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibrarySearch: true,
    }));
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });
    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledTimes(4);

    const ownedLibrariesTab = screen.getByTestId("owned-libraries-tab");
    expect(ownedLibrariesTab).toHaveClass("Mui-selected");

    const aclHeader = screen.getByTestId("header-librarySet_acls");
    expect(aclHeader).toBeInTheDocument();

    userEvent.click(screen.getByTestId("header-librarySet_acls"));
    await waitFor(() => {
      expect(
        mockCqlLibraryServiceApi.fetchCqlLibraries
      ).toHaveBeenLastCalledWith(
        OwnershipType.OWNED,
        10,
        0,
        { optionalSearchProperties: [], searchField: "" },
        "librarySet.acls,false",
        expect.any(AbortSignal)
      );
    });
    userEvent.click(screen.getByTestId("header-librarySet_acls"));
    await waitFor(() => {
      expect(
        mockCqlLibraryServiceApi.fetchCqlLibraries
      ).toHaveBeenLastCalledWith(
        OwnershipType.OWNED,
        10,
        0,
        { optionalSearchProperties: [], searchField: "" },
        "librarySet.acls,true",
        expect.any(AbortSignal)
      );
    });
    userEvent.click(screen.getByTestId("header-librarySet_acls"));
    await waitFor(() => {
      expect(
        mockCqlLibraryServiceApi.fetchCqlLibraries
      ).toHaveBeenLastCalledWith(
        OwnershipType.OWNED,
        10,
        0,
        { optionalSearchProperties: [], searchField: "" },
        "",
        expect.any(AbortSignal)
      );
    });

    aclHeader.focus();

    // Press Enter
    await userEvent.keyboard("{Enter}");
    await waitFor(() => {
      expect(
        mockCqlLibraryServiceApi.fetchCqlLibraries
      ).toHaveBeenLastCalledWith(
        OwnershipType.OWNED,
        10,
        0,
        { optionalSearchProperties: [], searchField: "" },
        "",
        expect.any(AbortSignal)
      );
    });
    // Press Space
    await userEvent.keyboard(" ");
    await waitFor(() => {
      expect(
        mockCqlLibraryServiceApi.fetchCqlLibraries
      ).toHaveBeenLastCalledWith(
        OwnershipType.OWNED,
        10,
        0,
        { optionalSearchProperties: [], searchField: "" },
        "",
        expect.any(AbortSignal)
      );
    });
    // hit extra code coverage. nothing happens.
    const target = screen.getByTestId("header-Actions");
    target.focus();
    userEvent.keyboard("{Enter}");
  });

  test("filter by and search libraries based on criteria", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibrarySearch: true,
    }));
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledTimes(4);

    const filterBy = screen.getByTestId("filter-by");
    const filterByDropDown = within(filterBy).getByRole("combobox", {
      hidden: true,
    }) as HTMLInputElement;
    userEvent.click(filterByDropDown);

    const optionsList = await screen.findAllByRole("option");
    expect(optionsList).toHaveLength(4);
    expect(optionsList[1]).toHaveTextContent("Library");
    userEvent.click(optionsList[1]);

    const input = screen.getByTestId("library-search-input");

    userEvent.type(input, "Diabetes");
    expect(input).toHaveValue("Diabetes");

    const searchIcon = await screen.findByTestId("search-icon");
    expect(searchIcon).toBeVisible();
    userEvent.click(searchIcon);

    await waitFor(() => {
      expect(
        mockCqlLibraryServiceApi.fetchCqlLibraries
      ).toHaveBeenNthCalledWith(
        5,
        OwnershipType.OWNED,
        10,
        0,
        { optionalSearchProperties: ["library"], searchField: "Diabetes" },
        "",
        abortController.signal
      );
    });
  });

  test("Checkbox interactions", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);

    userEvent.click(checkBoxes[2]);

    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).not.toBeDisabled();

    const deleteButton = await screen.findByTestId("delete-action-btn");
    expect(deleteButton).not.toBeDisabled();
  });

  test("Delete should work when everything is okay", async () => {
    // Set up mock specifically for this test
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);

    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();

    const deleteButton = await screen.findByTestId("delete-action-btn");
    expect(deleteButton).not.toBeDisabled();

    userEvent.click(deleteButton);

    expect(
      await screen.findByText("This Action cannot be undone.")
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.deleteDraft).toBeCalled();
    });
  });
  test("Delete should not delete when cancel is clicked", async () => {
    // Set up mock specifically for this test

    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();

    const deleteButton = await screen.findByTestId("delete-action-btn");
    expect(deleteButton).not.toBeDisabled();

    userEvent.click(deleteButton);

    expect(
      await screen.findByText("This Action cannot be undone.")
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.deleteDraft).not.toBeCalled();
    });
    expect(
      screen.queryByText("The Draft CQL Library has been deleted.")
    ).not.toBeInTheDocument();
  });

  test("Delete should display error message for delete draft library when non-owner attempts to delete", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    const axiosError: AxiosError = {
      response: {
        status: 403,
        data: {
          status: 403,
          error: "Conflict",
          message: "GOOD PERSON DO BAD THING",
        },
      } as AxiosResponse,
      toJSON: jest.fn(),
    } as unknown as AxiosError;

    mockCqlLibraryServiceApi.deleteDraft = jest
      .fn()
      .mockRejectedValueOnce(axiosError);

    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();

    const deleteButton = await screen.findByTestId("delete-action-btn");
    expect(deleteButton).not.toBeDisabled();

    userEvent.click(deleteButton);
    expect(
      await screen.findByText("This Action cannot be undone.")
    ).toBeInTheDocument();

    userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.deleteDraft).toHaveBeenCalled();
      expect(
        screen.getByText("User is not authorized to delete this CQL Library.")
      ).toBeInTheDocument();
    });
  });
  test("Delete should display error message for delete draft library when backend states not a draft", async () => {
    const axiosError: AxiosError = {
      response: {
        status: 409,
        data: {
          status: 409,
          error: "Conflict",
          message: "GOOD PERSON DO BAD THING",
        },
      } as AxiosResponse,
      toJSON: jest.fn(),
    } as unknown as AxiosError;
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    mockCqlLibraryServiceApi.deleteDraft = jest
      .fn()
      .mockRejectedValueOnce(axiosError);

    renderWithRouter();
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();

    const deleteButton = await screen.findByTestId("delete-action-btn");
    expect(deleteButton).not.toBeDisabled();

    userEvent.click(deleteButton);

    expect(
      await screen.findByText("This Action cannot be undone.")
    ).toBeInTheDocument();

    expect(
      await screen.findByText("Delete draft of TestCqlLibrary1?")
    ).toBeInTheDocument();
    userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.deleteDraft).toHaveBeenCalled();
      expect(
        screen.getByText(
          "This CQL Library is not in the correct state to be deleted."
        )
      ).toBeInTheDocument();
    });
  });

  test("Version should work when everything is okay", async () => {
    // Set up mock specifically for this test
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    mockCqlLibraryServiceApi.createVersion = jest
      .fn()
      .mockResolvedValueOnce(mockPageableVal.content[0]);
    renderWithRouter();
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();
    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).toBeDisabled();

    userEvent.click(versionButton);
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toBeCalled();
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    const majorButton = screen.getByLabelText("Major");
    userEvent.click(majorButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("create-version-continue-button")
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByTestId("create-version-continue-button");
    userEvent.click(continueButton);
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createVersion).toBeCalled();
    });
  });
  test("Version should not version when cancel is clicked", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();
    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).toBeDisabled();

    userEvent.click(versionButton);
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.fetchCqlLibrary).toBeCalled();
    });
    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });

    const cancelButton = screen.getByTestId("create-version-cancel-button");
    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    userEvent.click(cancelButton);
    await waitFor(() =>
      expect(
        screen.queryByTestId("create-version-cancel-button")
      ).not.toBeInTheDocument()
    );
  });

  it("should display unauthorized error while creating a version of a cql library", async () => {
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    mockCqlLibraryServiceApi.fetchCqlLibrary = jest.fn().mockResolvedValueOnce({
      id: "622e1f46d1fd3729d861e6cb",
      librarySetId: "librarySetId1",
      cqlLibraryName: "TestCqlLibrary1",
      model: Model.QICORE,
      createdAt: "1",
      createdBy: "testuseratexamplecom",
      lastModifiedAt: "",
      lastModifiedBy: "",
      draft: true,
      version: "0.0.000",
      cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
      cqlErrors: false,
      active: true,
    });
    const error = {
      response: {
        data: {
          status: 403,
        },
      },
    };

    mockCqlLibraryServiceApi.createVersion = jest
      .fn()
      .mockRejectedValueOnce(error);
    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();
    userEvent.click(versionButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    const majorButton = screen.getByLabelText("Major");
    userEvent.click(majorButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("create-version-continue-button")
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByTestId("create-version-continue-button");
    userEvent.click(continueButton);
    await waitFor(() => {
      expect(
        (mockCqlLibraryServiceApi.createVersion = jest
          .fn()
          .mockRejectedValueOnce(error))
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "User is unauthorized to create a version"
      );
    });
  });

  it("should display unauthorized error while creating a version of a cql library", async () => {
    const updatedPageableVal = { ...mockPageableVal };
    updatedPageableVal.content[0].draft = true;
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    const error = {
      response: {
        data: {
          status: 400,
        },
      },
    };

    mockCqlLibraryServiceApi.createVersion = jest
      .fn()
      .mockRejectedValueOnce(error);
    mockCqlLibraryServiceApi.fetchCqlLibrary = jest.fn().mockResolvedValueOnce({
      id: "622e1f46d1fd3729d861e6cb",
      librarySetId: "librarySetId1",
      cqlLibraryName: "TestCqlLibrary1",
      model: Model.QICORE,
      createdAt: "1",
      createdBy: "testuseratexamplecom",
      lastModifiedAt: "",
      lastModifiedBy: "",
      draft: true,
      version: "0.0.000",
      cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
      cqlErrors: false,
      active: true,
    });
    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).not.toBeDisabled();
    userEvent.click(versionButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Major")).toBeInTheDocument();
    });
    const majorButton = screen.getByLabelText("Major");
    userEvent.click(majorButton);

    await waitFor(() => {
      expect(
        screen.getByTestId("create-version-continue-button")
      ).toBeInTheDocument();
    });
    const continueButton = screen.getByTestId("create-version-continue-button");
    expect(continueButton).toBeEnabled();
    userEvent.click(continueButton);
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createVersion).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Requested Cql Library cannot be versioned"
      );
    });
  });

  test("Draft should work when everything is okay", async () => {
    const updatedPageableVal = { ...mockPageableVal };
    updatedPageableVal.content[0].draft = false;
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);

    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).toBeDisabled();
    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).not.toBeDisabled();

    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalled();
    });
  });
  test("should display bad request error while creating a draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 400,
        },
      },
    };
    const updatedPageableVal = { ...mockPageableVal };
    updatedPageableVal.content[0].draft = false;
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    mockCqlLibraryServiceApi.createDraft = jest
      .fn()
      .mockRejectedValueOnce(error);

    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).toBeDisabled();
    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).not.toBeDisabled();

    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createDraft).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Requested Cql Library cannot be drafted"
      );
    });
  });
  test("should display unauthorized error while creating a draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 403,
        },
      },
    };
    mockCqlLibraryServiceApi.createDraft = jest
      .fn()
      .mockRejectedValueOnce(error);
    const updatedPageableVal = { ...mockPageableVal };
    updatedPageableVal.content[0].draft = false;
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).toBeDisabled();
    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).not.toBeDisabled();

    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(mockCqlLibraryServiceApi.createDraft).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "User is unauthorized to create a draft"
      );
    });
  });
  test("should display server error while creating a draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 500,
          message: "Internal server error",
        },
      },
    };
    const updatedPageableVal = { ...mockPageableVal };
    updatedPageableVal.content[0].draft = false;
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);

    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).toBeDisabled();
    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).not.toBeDisabled();

    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(
        (mockCqlLibraryServiceApi.createDraft = jest
          .fn()
          .mockRejectedValueOnce(error))
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Internal server error"
      );
    });
  });
  test("should display unique library name error for changing to already used name during draft a cql library", async () => {
    const error = {
      response: {
        data: {
          status: 400,
          message: "Library name must be unique.",
        },
      },
    };
    const updatedPageableVal = { ...mockPageableVal };
    updatedPageableVal.content[0].draft = false;
    mockCqlLibraryServiceApi.fetchCqlLibraries = jest
      .fn()
      .mockResolvedValue(mockPageableVal);
    renderWithRouter();

    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    // Ensure the interactions are correct after rendering the library
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(50);
    userEvent.click(checkBoxes[1]);

    const versionButton = await screen.findByTestId("version-action-btn");
    expect(versionButton).toBeDisabled();
    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).not.toBeDisabled();

    userEvent.click(draftButton);
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    const cqlLibraryNameInput = screen.getByRole("textbox", {
      name: "CQL Library Name",
    });
    userEvent.clear(cqlLibraryNameInput);
    userEvent.type(cqlLibraryNameInput, "TestingLibraryName12");
    userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => {
      expect(
        (mockCqlLibraryServiceApi.createDraft = jest
          .fn()
          .mockRejectedValueOnce(error))
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("cql-library-list-snackBar")).toHaveTextContent(
        "Requested Cql Library cannot be drafted. Library name must be unique."
      );
    });
  });
});
