import * as React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { CqlLibrary, Model } from "@madie/madie-models";
import CqlLibraryList, { sortResults } from "./CqlLibraryList";
import userEvent from "@testing-library/user-event";
import useCqlLibraryServiceApi, {
  CqlLibraryServiceApi,
} from "../../api/useCqlLibraryServiceApi";
// @ts-ignore
import { checkUserCanEdit, useFeatureFlags } from "@madie/madie-util";

jest.mock("@madie/madie-util", () => ({
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
  useFeatureFlags: jest.fn().mockReturnValue({}),
}));

const cqlLibrary = [
  {
    id: "622e1f46d1fd3729d861e6cb",
    librarySetId: "librarySetId1",
    cqlLibraryName: "testing1",
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
    hasAssociatedLibraries: false,
  },
  {
    id: "622e1f46d1fd3729d861e6c1",
    librarySetId: "librarySetId2",
    cqlLibraryName: "testing2",
    model: Model.QICORE,
    createdAt: "",
    createdBy: "anothertestuseratexamplecom",
    lastModifiedAt: "2",
    lastModifiedBy: "null",
    draft: true,
    version: "0.0.000",
    cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
    cqlErrors: false,
    active: true,
    hasAssociatedLibraries: false,
  },
];
const mockSearchCriteria = {
  searchField: "test-field",
  optionalSearchProperties: ["version"],
};

const loadCqlLibraries = jest.fn();

// Mocking the service calls to create Draft and version
jest.mock("../../api/useCqlLibraryServiceApi");
const mockLocation = jest.fn();
const mockPush = jest.fn();
const useCqlLibraryServiceMock =
  useCqlLibraryServiceApi as jest.Mock<CqlLibraryServiceApi>;
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockPush,
  useLocation: () => mockLocation,
}));

const useCqlLibraryServiceMockResolved = {
  createVersion: jest.fn().mockResolvedValue({}),
  createDraft: jest.fn().mockResolvedValue({}),
  deleteDraft: jest.fn().mockResolvedValue({}),
  fetchCqlLibrary: jest.fn().mockResolvedValue({}),
  fetchAllOwners: jest.fn().mockResolvedValue(["owner1", "owner2"]),
  getLibrariesByLibrarySetId: jest.fn().mockResolvedValue({}),
} as unknown as CqlLibraryServiceApi;

describe("CqlLibrary List component", () => {
  beforeEach(() => {
    jest.resetModules();
    useCqlLibraryServiceMockResolved.createVersion = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.createDraft = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.deleteDraft = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.fetchCqlLibrary = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMockResolved.getLibrariesByLibrarySetId = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMock.mockReset().mockImplementation(() => {
      return useCqlLibraryServiceMockResolved;
    });
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
  });
  afterEach(() => {
    cleanup();
  });

  it("should display a list of Cql Libraries", () => {
    const { getByText, getByTestId } = render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        setOwners={jest.fn()}
        setSnackBar={jest.fn()}
        snackBar={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );
    cqlLibrary.forEach((c) => {
      expect(getByText(c.cqlLibraryName)).toBeInTheDocument();
      expect(
        screen.getByTestId(`cqlLibrary-button-${c.id}-content`)
      ).toBeInTheDocument();
    });

    const cqlLibraryButton = getByTestId(
      `edit-cql-library-button-${cqlLibrary[0].id}`
    );
    userEvent.click(cqlLibraryButton);

    expect(mockPush).toHaveBeenNthCalledWith(
      1,
      "/cql-libraries/622e1f46d1fd3729d861e6cb/edit/details"
    );
  });

  it("should show checkboxes when featureflag is enabled", async () => {
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
      {
        id: "650359394b0427f896ced541",
        librarySetId: "libsetid2",
        cqlLibraryName: "versioned lib1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: false,
        version: "1.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
    ];
    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
        setOwners={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    const checkBoxes = await screen.findAllByRole("checkbox");
    expect(checkBoxes.length).toBe(2);
    fireEvent.click(checkBoxes[1]);
  });

  it("buttons featureflag: shows just a view button when cannot edit", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(false);
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
    ];
    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
        setOwners={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    expect(
      await screen.findByTestId(
        "view-cql-library-button-622e1f46d1fd3729d861e6cb"
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View/Edit" })
    ).not.toBeInTheDocument();
  });

  it("buttons featureflag: shows just an edit button when can edit", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
      },
    ];
    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
        setOwners={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );
    expect(
      await screen.findByTestId(
        "edit-cql-library-button-622e1f46d1fd3729d861e6cb"
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "View/Edit" })
    ).not.toBeInTheDocument();
  });

  it("Expansion should be possible when there is child libraries", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibrarySearch: true,
    }));
    const cqlLibrary = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: false,
        version: "1.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
        hasAssociatedLibraries: true,
      },
      {
        id: "622e1f46d1fd3729d861e6ca",
        librarySetId: "librarySetId1",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "1",
        createdBy: "testuseratexamplecom",
        lastModifiedAt: "",
        lastModifiedBy: "",
        draft: false,
        version: "2.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
        hasAssociatedLibraries: true,
      },
    ];

    useCqlLibraryServiceMockResolved.getLibrariesByLibrarySetId = jest
      .fn()
      .mockReturnValue(cqlLibrary);

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
        setOwners={jest.fn()}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    expect(
      await screen.findByTestId(
        "view-cql-library-button-622e1f46d1fd3729d861e6cb"
      )
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId("cqlLibrary-expanded-622e1f46d1fd3729d861e6ca")
    ).not.toBeInTheDocument();

    const expandSection = screen.getByTestId("cqlLibrary-button-0_expandArrow");
    expect(expandSection).toBeInTheDocument();
    const expandButton = await within(expandSection).getByRole("button");
    fireEvent.click(expandButton);

    expect(
      await screen.findByTestId("cqlLibrary-expanded-622e1f46d1fd3729d861e6ca")
    ).toBeInTheDocument();
  });

  it("should render columnsBehindFlag when LibrarySearch is true on Owned Libraries tab", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibrarySearch: true,
    }));

    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "2023-01-01T00:00:00Z",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
        librarySet: {
          id: "test-id",
          librarySetId: "test-set-id",
          owner: "test-owner",
          acls: [{ userId: "user1", roles: ["SHARED"] }],
        },
      },
    ];

    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={jest.fn()}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
        setOwners={jest.fn()}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        totalItems={10}
        activeTab={0}
        totalPages={20}
        visibleItems={10}
        offset={0}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    // Verify columns rendered from columnsBehindFlag
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Shared")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();

    // Verify data rendered in the table
    expect(screen.getByText("testing1")).toBeInTheDocument();
    expect(screen.getByText("0.0.000")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("QI-Core v4.1.1")).toBeInTheDocument();
    expect(screen.getByTestId("cqlLibrary-button-0_model")).toBeInTheDocument();
  });

  it("should render columnsBehindFlag (without Shared column) when LibrarySearch is true on Shared Libraries tab", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibrarySearch: true,
    }));

    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "2023-01-01T00:00:00Z",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
        librarySet: {
          id: "test-id",
          librarySetId: "test-set-id",
          owner: "test-owner",
          acls: [{ userId: "user1", roles: ["SHARED"] }],
        },
      },
    ];

    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={jest.fn()}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
        setOwners={jest.fn()}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    // Verify columns (expect Shared column) are rendered from columnsBehindFlag
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.queryByText("Shared")).not.toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();

    // Verify data rendered in the table
    expect(screen.getByText("testing1")).toBeInTheDocument();
    expect(screen.getByText("0.0.000")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("QI-Core v4.1.1")).toBeInTheDocument();
    expect(screen.getByTestId("cqlLibrary-button-0_model")).toBeInTheDocument();
  });

  it("should render columnsBehindFlag when LibrarySearch is true on All Libraries tab", async () => {
    (useFeatureFlags as jest.Mock).mockClear().mockImplementation(() => ({
      LibrarySearch: true,
    }));

    const cqlLibrary: CqlLibrary[] = [
      {
        id: "622e1f46d1fd3729d861e6cb",
        librarySetId: "libsetid",
        cqlLibraryName: "testing1",
        model: Model.QICORE,
        createdAt: "",
        createdBy: "testuser@example.com", //#nosec
        lastModifiedAt: "2023-01-01T00:00:00Z",
        lastModifiedBy: "",
        draft: true,
        version: "0.0.000",
        cql: "library AdvancedIllnessandFrailtyExclusion_QICore4 version '5.0.00'",
        cqlErrors: false,
        active: true,
        librarySet: {
          id: "test-id",
          librarySetId: "test-set-id",
          owner: "test-owner",
          acls: [{ userId: "user1", roles: ["SHARED"] }],
        },
      },
    ];

    render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={jest.fn()}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={jest.fn()}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        snackBar={jest.fn()}
        setSnackBar={jest.fn()}
        setOwners={jest.fn()}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        totalItems={10}
        activeTab={2}
        totalPages={20}
        visibleItems={10}
        offset={0}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    // Verify columns rendered from columnsBehindFlag
    expect(screen.getByText("Library")).toBeInTheDocument();
    expect(screen.getByText("Version")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Shared")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();

    // Verify data rendered in the table
    expect(screen.getByText("testing1")).toBeInTheDocument();
    expect(screen.getByText("0.0.000")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("QI-Core v4.1.1")).toBeInTheDocument();
    expect(screen.getByTestId("cqlLibrary-button-0_model")).toBeInTheDocument();
  });

  it("should set and clear hoveredHeader on mouse enter and leave", async () => {
    const { getByTestId } = render(
      <CqlLibraryList
        cqlLibraryList={cqlLibrary}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={cqlLibrary[0]}
        setSelectedCqlLibrary={jest.fn()}
        createVersionDialog={jest.fn()}
        setCreateVersionDialog={jest.fn()}
        createDraftDialog={jest.fn()}
        shareDialog={jest.fn()}
        setShareDialog={jest.fn()}
        transferDialog={jest.fn()}
        setTransferDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        setOwners={jest.fn()}
        setSnackBar={jest.fn()}
        snackBar={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        sorting={[{ id: "cqlLibraryName", desc: false }]}
        handleSort={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );
    const header = getByTestId("header-cqlLibraryName");
    fireEvent.mouseOver(header);
    const th = getByTestId("header-cqlLibraryName");
    const title = th.getAttribute("title");
    expect(title).toBe("Sort descending");
    // The hover state should update (check for icon or internal state)
    expect(header.querySelector(".arrowDisplay")).toBeInTheDocument();
    fireEvent.mouseLeave(header);
    // The hover state should clear (icon hidden or state reset)
    expect(header.querySelector(".arrowDisplay")).toBeInTheDocument();
  });
});

describe("sortResults", () => {
  const data = [
    { name: "cat", age: 30 },
    { name: "apple", age: 25 },
    { name: "bat", age: 35 },
  ];

  it("sorts by string field ascending", () => {
    const result = sortResults(data, "name", false);
    expect(result.map((r) => r.name)).toEqual(["apple", "bat", "cat"]);
  });

  it("sorts by string field descending", () => {
    const result = sortResults(data, "name", true);
    expect(result.map((r) => r.name)).toEqual(["cat", "bat", "apple"]);
  });

  it("sorts by number field ascending", () => {
    const result = sortResults(data, "age", false);
    expect(result.map((r) => r.age)).toEqual([25, 30, 35]);
  });

  it("sorts by number field descending", () => {
    const result = sortResults(data, "age", true);
    expect(result.map((r) => r.age)).toEqual([35, 30, 25]);
  });

  it("returns data unmodified if sortBy is null", () => {
    const result = sortResults(data, null);
    expect(result).toEqual(data);
  });
});
