import * as React from "react";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { CqlLibrary, Model } from "@madie/madie-models";
import CqlLibraryListComponent, {
  sortResults,
  TRANSFER_LIBRARY_SUCCESS,
  TRANSFER_LIBRARY_FAILURE,
} from "./CqlLibraryList";
import { INVALID_HARP_ID_MESSAGE } from "../common/transferDialog/TransferDialog";
import userEvent from "@testing-library/user-event";
// @ts-ignore
import CqlLibraryServiceApi, {
  useIsRoleOrFeatureEnabled,
  checkUserCanEdit,
  useFeatureFlags,
  useCqlLibraryServiceApi,
  useUserServiceApi,
} from "@madie/madie-util";

const CqlLibraryList = CqlLibraryListComponent as any;

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
  useUserRoles: jest.fn(() => ({})),
  useIsRoleOrFeatureEnabled: jest.fn(),
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
] as unknown as CqlLibrary[];
const mockSearchCriteria = {
  searchField: "test-field",
  optionalSearchProperties: ["version"],
};

const loadCqlLibraries = jest.fn();

const mockLocation = jest.fn();
const mockPush = jest.fn();
const useCqlLibraryServiceMock =
  useCqlLibraryServiceApi as jest.Mock<CqlLibraryServiceApi>;
jest.mock("react-router-dom", () => ({
  ...(jest.requireActual("react-router-dom") as any),
  useNavigate: () => mockPush,
  useLocation: () => mockLocation,
}));

const mockCqlLibraryServiceResolved = {
  createVersion: jest.fn().mockResolvedValue({}),
  createDraft: jest.fn().mockResolvedValue({}),
  deleteDraft: jest.fn().mockResolvedValue({}),
  fetchCqlLibrary: jest.fn().mockResolvedValue({}),
  fetchAllOwners: jest.fn().mockResolvedValue(["owner1", "owner2"]),
  getLibrariesByLibrarySetId: jest.fn().mockResolvedValue({}),
  transferLibraries: jest.fn().mockResolvedValue({ status: 200 }),
} as unknown as CqlLibraryServiceApi;

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
  useUserRoles: jest.fn(() => ({})),
  useCqlLibraryServiceApi: jest.fn(() => mockCqlLibraryServiceResolved),
  useUserServiceApi: jest.fn(),
  useIsRoleOrFeatureEnabled: jest.fn(),
}));

describe("CqlLibrary List component", () => {
  beforeEach(() => {
    jest.resetModules();
    mockCqlLibraryServiceResolved.createVersion = jest
      .fn()
      .mockResolvedValue({});
    mockCqlLibraryServiceResolved.createDraft = jest.fn().mockResolvedValue({});
    mockCqlLibraryServiceResolved.deleteDraft = jest.fn().mockResolvedValue({});
    mockCqlLibraryServiceResolved.fetchCqlLibrary = jest
      .fn()
      .mockResolvedValue({});
    mockCqlLibraryServiceResolved.getLibrariesByLibrarySetId = jest
      .fn()
      .mockResolvedValue({});
    useCqlLibraryServiceMock.mockReset().mockImplementation(() => {
      return mockCqlLibraryServiceResolved;
    });
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
    (useIsRoleOrFeatureEnabled as jest.Mock).mockReturnValue(false);
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
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

    const actionButton = getByTestId(`cql-library-action-${cqlLibrary[0].id}`);

    expect(actionButton).toHaveTextContent("Edit");

    userEvent.click(actionButton);

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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
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
    expect(checkBoxes.length).toBe(3);
    fireEvent.click(checkBoxes[1]);
  });

  it("should open and close review dialog from action center", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });

    render(
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
        compareVersionsDialog={false}
        setCompareVersionsDialog={jest.fn()}
        setCreateDraftDialog={jest.fn()}
        setOwners={jest.fn()}
        setSnackBar={jest.fn()}
        snackBar={jest.fn()}
        totalItems={10}
        activeTab={1}
        totalPages={20}
        visibleItems={10}
        offset={0}
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
        setStatusHandler={jest.fn()}
      />
    );

    const checkBoxes = await screen.findAllByRole("checkbox");
    fireEvent.click(checkBoxes[1]);

    userEvent.click(screen.getByTestId("review-action-btn"));

    expect(
      await screen.findByText("Mark Library Ready for Review")
    ).toBeInTheDocument();

    userEvent.click(screen.getByTestId("review-dialog-cancel-button"));

    await waitFor(() => {
      expect(
        screen.queryByText("Mark Library Ready for Review")
      ).not.toBeVisible();
    });
  });

  it("Shows a View button when user cannot edit", async () => {
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    const actionButton = await screen.findByTestId(
      `cql-library-action-${cqlLibrary[0].id}`
    );
    expect(actionButton).toHaveTextContent("View");
  });

  it("Shows an Edit button when use edit", async () => {
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    const actionButton = await screen.findByTestId(
      `cql-library-action-${cqlLibrary[0].id}`
    );
    expect(actionButton).toHaveTextContent("Edit");
  });

  it("Expansion should be possible when there is child libraries", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(true);
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

    mockCqlLibraryServiceResolved.getLibrariesByLibrarySetId = jest
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
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
      await screen.findByTestId("cql-library-action-622e1f46d1fd3729d861e6cb")
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId("cqlLibrary-expanded-622e1f46d1fd3729d861e6ca")
    ).not.toBeInTheDocument();

    const expandSection = screen.getByTestId("measure-name-0_expandArrow");
    expect(expandSection).toBeInTheDocument();
    const expandButton = await within(expandSection).getByRole("button");
    fireEvent.click(expandButton);

    expect(
      await screen.findByTestId("cqlLibrary-expanded-622e1f46d1fd3729d861e6ca")
    ).toBeInTheDocument();
  });

  it("should render columnsToBeAdded on Owned Libraries tab", async () => {
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
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
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();

    // Verify data rendered in the table
    expect(screen.getByText("testing1")).toBeInTheDocument();
    expect(screen.getByText("0.0.000")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("QI-Core v4.1.1")).toBeInTheDocument();
    expect(screen.getByTestId("measure-name-0_model")).toBeInTheDocument();
  });

  it("should render columnsToBeAdded (without Shared column) on Shared Libraries tab", async () => {
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
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
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();

    // Verify data rendered in the table
    expect(screen.getByText("testing1")).toBeInTheDocument();
    expect(screen.getByText("0.0.000")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("QI-Core v4.1.1")).toBeInTheDocument();
    expect(screen.getByTestId("measure-name-0_model")).toBeInTheDocument();
  });

  it("should render columnsToBeAdded on All Libraries tab", async () => {
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
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
    expect(screen.getByText("Owner")).toBeInTheDocument();
    expect(screen.getByText("Updated")).toBeInTheDocument();

    // Verify data rendered in the table
    expect(screen.getByText("testing1")).toBeInTheDocument();
    expect(screen.getByText("0.0.000")).toBeInTheDocument();
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("QI-Core v4.1.1")).toBeInTheDocument();
    expect(screen.getByTestId("measure-name-0_model")).toBeInTheDocument();
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

describe("Library lock functionality", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useFeatureFlags as jest.Mock).mockImplementation(() => ({}));
  });

  it("should display lock icon and 'View' text when library is locked by another user", async () => {
    const lockedLibrary = {
      ...cqlLibrary[0],
      cqlLibraryLock: {
        lockedBy: "AnotherUser",
        lockedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 900000).toISOString(),
        libraryId: cqlLibrary[0].id,
      },
    };

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[lockedLibrary]}
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    const actionButton = await screen.findByTestId(
      `cql-library-action-${lockedLibrary.id}`
    );

    expect(actionButton).toBeInTheDocument();
    expect(actionButton).toHaveTextContent("View");
    expect(
      within(actionButton).getByTestId(
        "library-lock-icon-622e1f46d1fd3729d861e6cb"
      )
    ).toBeInTheDocument();
    expect(actionButton).toHaveAttribute(
      "aria-label",
      expect.stringContaining("Locked by AnotherUser")
    );
  });

  it("should display 'Edit' when user has edit permission and library is not locked", async () => {
    const unlockedLibrary = {
      ...cqlLibrary[0],
      libraryMetaData: { draft: true },
      librarySet: {
        owner: "testUser",
        acls: [],
      },
    };

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[unlockedLibrary]}
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    const actionButton = await screen.findByTestId(
      `cql-library-action-${unlockedLibrary.id}`
    );

    expect(actionButton).toHaveTextContent("Edit");
    expect(
      within(actionButton).queryByTestId(
        "library-lock-icon-622e1f46d1fd3729d861e6cb"
      )
    ).not.toBeInTheDocument();
  });

  it("should display 'View' without lock icon when user doesn't have edit permission", async () => {
    (checkUserCanEdit as jest.Mock).mockReturnValue(false);

    const library = {
      ...cqlLibrary[0],
      libraryMetaData: { draft: false },
    };

    render(
      <CqlLibraryList
        setSelectedLibraries={jest.fn()}
        cqlLibraryList={[library]}
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
        currentSort=""
        currentDirection=""
        setCurrentSort={jest.fn()}
        setCurrentDirection={jest.fn()}
        setSearchCriteria={jest.fn()}
        handlePageChange={jest.fn()}
        curLimit={10}
        curPage={1}
        searchCriteria={mockSearchCriteria}
        setToastOpen={jest.fn()}
        setToastMessage={jest.fn()}
        setToastType={jest.fn()}
      />
    );

    const actionButton = await screen.findByTestId(
      `cql-library-action-${library.id}`
    );

    expect(actionButton).toHaveTextContent("View");
    expect(
      within(actionButton).queryByTestId(
        "library-lock-icon-622e1f46d1fd3729d861e6cb"
      )
    ).not.toBeInTheDocument();
  });

  describe("transferLibraries", () => {
    const mockSetToastOpen = jest.fn();
    const mockSetToastMessage = jest.fn();
    const mockSetToastType = jest.fn();
    const mockSetStatusHandler = jest.fn();

    const renderWithTransferDialog = () =>
      render(
        <CqlLibraryList
          cqlLibraryList={[]}
          onListUpdate={loadCqlLibraries}
          setSelectedLibraries={jest.fn()}
          deleteDraftDialog={jest.fn()}
          setDeleteDraftDialog={jest.fn()}
          selectedCQLLibrary={cqlLibrary[0]}
          setSelectedCqlLibrary={jest.fn()}
          createVersionDialog={jest.fn()}
          setCreateVersionDialog={jest.fn()}
          createDraftDialog={jest.fn()}
          setCreateDraftDialog={jest.fn()}
          shareDialog={jest.fn()}
          setShareDialog={jest.fn()}
          transferDialog={{ open: true }}
          setTransferDialog={jest.fn()}
          compareVersionsDialog={false}
          setCompareVersionsDialog={jest.fn()}
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
          setToastOpen={mockSetToastOpen}
          setToastMessage={mockSetToastMessage}
          setToastType={mockSetToastType}
          setStatusHandler={mockSetStatusHandler}
        />
      );

    beforeEach(() => {
      mockSetToastOpen.mockClear();
      mockSetToastMessage.mockClear();
      mockSetToastType.mockClear();
      mockSetStatusHandler.mockClear();
      mockCqlLibraryServiceResolved.transferLibraries = jest
        .fn()
        .mockResolvedValue({ status: 200 });
    });

    it("should show success toast and close dialog on successful transfer", async () => {
      const { getByTestId } = renderWithTransferDialog();

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "validUser" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(mockSetToastOpen).toHaveBeenCalledWith(true);
        expect(mockSetToastType).toHaveBeenCalledWith("success");
        expect(mockSetToastMessage).toHaveBeenCalledWith(
          TRANSFER_LIBRARY_SUCCESS
        );
      });
    });

    it("should call setStatusHandler with warning on partial transfer failure (207)", async () => {
      mockCqlLibraryServiceResolved.transferLibraries = jest
        .fn()
        .mockResolvedValue({ status: 207, data: [] });

      const { getByTestId } = renderWithTransferDialog();

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "someUser" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(mockSetStatusHandler).toHaveBeenCalledWith(
          expect.objectContaining({
            warning: expect.objectContaining({ status: true }),
          })
        );
        expect(mockSetToastOpen).not.toHaveBeenCalled();
      });
    });

    it("should show field-levl error and keep dialog open when API returns 400 with invalid HARP ID", async () => {
      mockCqlLibraryServiceResolved.transferLibraries = jest
        .fn()
        .mockRejectedValue({
          response: {
            status: 400,
            data: { message: INVALID_HARP_ID_MESSAGE },
          },
        });

      const { getByTestId } = renderWithTransferDialog();

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "invalidUser" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(screen.getByText(INVALID_HARP_ID_MESSAGE)).toBeInTheDocument();
        expect(screen.getByTestId("transfer-dialog")).toBeInTheDocument();
        expect(mockSetToastOpen).not.toHaveBeenCalled();
      });
    });

    it("should show failure toast and close dialog on generic error", async () => {
      mockCqlLibraryServiceResolved.transferLibraries = jest
        .fn()
        .mockRejectedValue({ response: { status: 500 } });

      const { getByTestId } = renderWithTransferDialog();

      fireEvent.change(getByTestId("harp-id-input"), {
        target: { value: "someUser" },
      });
      fireEvent.click(getByTestId("transfer-save-button"));

      await waitFor(() => {
        expect(mockSetToastOpen).toHaveBeenCalledWith(true);
        expect(mockSetToastType).toHaveBeenCalledWith("danger");
        expect(mockSetToastMessage).toHaveBeenCalledWith(
          TRANSFER_LIBRARY_FAILURE
        );
      });
    });
  });
});
