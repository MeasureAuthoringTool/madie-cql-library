import "@testing-library/jest-dom";
// NOTE: jest-dom adds handy assertions to Jest and is recommended, but not required

import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewCqlLibrary from "./CqlLibraryLanding";
import { CqlLibraryServiceApi } from "../../api/useCqlLibraryServiceApi";
import { ApiContextProvider, ServiceConfig } from "../../api/ServiceContext";
import userEvent from "@testing-library/user-event";
import { Model } from "@madie/madie-models";
import { useFeatureFlags } from "@madie/madie-util";
import { AxiosError, AxiosResponse } from "axios";

const abortController = new AbortController();

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
  },
];

jest.mock("@madie/madie-util", () => ({
  useDocumentTitle: jest.fn(),
  useOktaTokens: () => ({
    getAccessToken: () => "test.jwt",
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

jest.mock("../../api/useCqlLibraryServiceApi", () =>
  jest.fn(() => mockCqlLibraryServiceApi)
);

const mockCqlLibraryServiceApi = {
  fetchCqlLibraries: jest.fn().mockResolvedValue(cqlLibrary),
  deleteDraft: jest.fn().mockResolvedValue({}),
} as unknown as CqlLibraryServiceApi;

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
    jest.clearAllTimers();
  });

  test("shows my Cql Libraries on page load", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewCqlLibrary />
      </ApiContextProvider>
    );
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    const cqlLibrary1Model = await screen.findByText("QI-Core v4.1.1");
    expect(cqlLibrary1Model).toBeInTheDocument();
    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      true,
      abortController.signal
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
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });
    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      true,
      abortController.signal
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
      false,
      abortController.signal
    );
  });

  test("SQL Library Search removes non-matching libraries", async () => {
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewCqlLibrary />
      </ApiContextProvider>
    );
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    expect(mockCqlLibraryServiceApi.fetchCqlLibraries).toHaveBeenCalledWith(
      true,
      abortController.signal
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
      false,
      abortController.signal
    );
    const searchBox = await screen.getByTestId("library-filter-input");
    expect(searchBox).toBeInTheDocument();
    userEvent.type(searchBox, "1");
    fireEvent.click(screen.getByTestId("library-filter-submit"));
    expect(cqlLibrary2).not.toBeInTheDocument();
  });

  test("Checkbox interactions", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibraryListCheckboxes: true,
      LibraryListButtons: true,
    }));
    render(
      <ApiContextProvider value={serviceConfig}>
        <NewCqlLibrary />
      </ApiContextProvider>
    );
    await waitFor(() => {
      const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
      expect(cqlLibrary1).toBeInTheDocument();
    });

    mockCqlLibraryServiceApi.fetchCqlLibraries = jest.fn().mockResolvedValue([
      {
        id: "67180dd54665c8239413ba90",
        cqlLibraryName: "TestLib",
        createdAt: "2024-10-22T20:40:53.212Z",
        model: "QI-Core v4.1.1",
        version: "0.0.000",
        draft: false,
      },
    ]);
    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(3);

    userEvent.click(checkBoxes[2]);

    const draftButton = await screen.findByTestId("draft-action-btn");
    expect(draftButton).not.toBeDisabled();

    const deleteButton = await screen.findByTestId("delete-action-btn");
    expect(deleteButton).not.toBeDisabled();
  });
  describe("Delete Action Tests", () => {
    beforeEach(() => {
      jest.resetModules();
      (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
        LibraryListCheckboxes: true,
        LibraryListButtons: true,
      }));
    });
    afterEach(() => {
      jest.clearAllMocks();
      jest.clearAllTimers();
    });
    test("Delete should work when everything is okay", async () => {
      // Set up mock specifically for this test
      mockCqlLibraryServiceApi.fetchCqlLibraries = jest.fn().mockResolvedValue([
        {
          id: "622e1f46d1fd3729d861e6cb",
          cqlLibraryName: "TestCqlLibrary1",
          model: Model.QICORE,
          createdAt: null,
          createdBy: null,
          lastModifiedAt: null,
          lastModifiedBy: null,
          draft: true,
        },
      ]);

      render(
        <ApiContextProvider value={serviceConfig}>
          <NewCqlLibrary />
        </ApiContextProvider>
      );

      await waitFor(() => {
        const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
        expect(cqlLibrary1).toBeInTheDocument();
      });

      // Ensure the interactions are correct after rendering the library
      const checkBoxes = await screen.findAllByRole("checkbox");
      expect(checkBoxes.length).toBe(2);
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
      mockCqlLibraryServiceApi.fetchCqlLibraries = jest.fn().mockResolvedValue([
        {
          id: "622e1f46d1fd3729d861e6cb",
          cqlLibraryName: "TestCqlLibrary1",
          model: Model.QICORE,
          createdAt: null,
          createdBy: null,
          lastModifiedAt: null,
          lastModifiedBy: null,
          draft: true,
        },
      ]);

      render(
        <ApiContextProvider value={serviceConfig}>
          <NewCqlLibrary />
        </ApiContextProvider>
      );

      await waitFor(() => {
        const cqlLibrary1 = screen.getByText("TestCqlLibrary1");
        expect(cqlLibrary1).toBeInTheDocument();
      });

      // Ensure the interactions are correct after rendering the library
      const checkBoxes = await screen.findAllByRole("checkbox");
      expect(checkBoxes.length).toBe(2);
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
      jest.clearAllMocks();
      jest.clearAllTimers();
      // Set up mock specifically for this test
      mockCqlLibraryServiceApi.fetchCqlLibraries = jest.fn().mockResolvedValue([
        {
          id: "622e1f46d1fd3729d861e6cb",
          librarySetId: "libsetid",
          cqlLibraryName: "testing1",
          model: Model.QICORE,
          createdAt: "",
          createdBy: "testuser@example.com", //#nosec
          lastModifiedAt: "",
          lastModifiedBy: "",
          draft: true, // need this to be true for UI to present delete option
          version: "0.0.000",
          cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
          cqlErrors: false,
          active: true,
        },
      ]);
      const axiosError: AxiosError = {
        response: {
          status: 403,
          data: {
            status: 403,
            error: "Forbidden",
            message: "BAD PERSON DO BAD THING",
          },
        } as AxiosResponse,
        toJSON: jest.fn(),
      } as unknown as AxiosError;

      mockCqlLibraryServiceApi.deleteDraft = jest
        .fn()
        .mockRejectedValueOnce(axiosError);

      render(
        <ApiContextProvider value={serviceConfig}>
          <NewCqlLibrary />
        </ApiContextProvider>
      );

      await waitFor(() => {
        const cqlLibrary1 = screen.getByText("testing1");
        expect(cqlLibrary1).toBeInTheDocument();
      });

      // Ensure the interactions are correct after rendering the library
      const checkBoxes = await screen.findAllByRole("checkbox");
      expect(checkBoxes.length).toBe(2);
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
        expect(
          (mockCqlLibraryServiceApi.deleteDraft = jest
            .fn()
            .mockRejectedValueOnce(axiosError))
        );
      });
      expect(
        await screen.findByText(
          "User is not authorized to delete this CQL Library."
        )
      ).toBeInTheDocument();
    });
    test("Delete should display error message for delete draft library when backend states not a draft", async () => {
      // this scenario could possibly happen if the library document is versioned in a different window/tab
      // or by a different user (once sharing is added) but current window thinks library document is still draft

      // Set up mock specifically for this test
      jest.clearAllMocks();
      jest.clearAllTimers();
      mockCqlLibraryServiceApi.fetchCqlLibraries = jest.fn().mockResolvedValue([
        {
          id: "622e1f46d1fd3729d861e6cb",
          librarySetId: "libsetid",
          cqlLibraryName: "testing1",
          model: Model.QICORE,
          createdAt: "",
          createdBy: "testuser@example.com", //#nosec
          lastModifiedAt: "",
          lastModifiedBy: "",
          draft: true, // need this to be true for UI to present delete option
          version: "0.0.000",
          cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
          cqlErrors: false,
          active: true,
        },
      ]);
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

      render(
        <ApiContextProvider value={serviceConfig}>
          <NewCqlLibrary />
        </ApiContextProvider>
      );

      await waitFor(() => {
        const cqlLibrary1 = screen.getByText("testing1");
        expect(cqlLibrary1).toBeInTheDocument();
      });

      // Ensure the interactions are correct after rendering the library
      const checkBoxes = await screen.findAllByRole("checkbox");
      expect(checkBoxes.length).toBe(2);
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
        await screen.findByText("Delete draft of testing1?")
      ).toBeInTheDocument();
      userEvent.click(screen.getByRole("button", { name: "Yes, Delete" }));
      await waitFor(() => {
        expect(
          (mockCqlLibraryServiceApi.deleteDraft = jest
            .fn()
            .mockRejectedValueOnce(axiosError))
        );
      });
      expect(
        await screen.findByText(
          "User is not authorized to delete this CQL Library."
        )
      ).toBeInTheDocument();
    });
  });
});
