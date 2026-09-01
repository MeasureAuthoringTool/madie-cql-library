import * as mockLibraryActionStubs from "../../__mocks__/libraryActionStubs";
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
import CqlLibraryListComponent, { sortResults } from "./CqlLibraryList";
import userEvent from "@testing-library/user-event";
import CqlLibraryServiceApi, {
  useIsRoleOrFeatureEnabled,
  checkUserCanEdit,
  useFeatureFlags,
  useCqlLibraryServiceApi,
  useUserRoles,
  // @ts-ignore
} from "@madie/madie-util";

const CqlLibraryList = CqlLibraryListComponent as any;

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

const mockCqlLibraryReviewServiceResolved = {
  getCqlLibraryReview: jest.fn().mockResolvedValue(null),
  createCqlLibraryReview: jest.fn().mockResolvedValue({ id: "new-review-id" }),
  updateCqlLibraryReview: jest
    .fn()
    .mockResolvedValue({ id: "existing-review-id" }),
};

jest.mock("@madie/madie-util", () => ({
  ...mockLibraryActionStubs,
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
  useCqlLibraryReviewServiceApi: jest.fn(
    () => mockCqlLibraryReviewServiceResolved
  ),
  useUserServiceApi: jest.fn(),
  useIsRoleOrFeatureEnabled: jest.fn(),
  ManageReviewDialog: ({ open, entityType, entityId }: any) =>
    open ? (
      <div data-testid="manage-review-dialog">
        Manage Review Dialog {entityType} {entityId}
      </div>
    ) : null,
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
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: [],
      isAdmin: false,
      isReviewer: false,
    });
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

  it("should open the Manage Review dialog from the action center for reviewers", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
    (useUserRoles as jest.Mock).mockReturnValue({
      roles: ["MADiE-Reviewer"],
      isAdmin: false,
      isReviewer: true,
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

    const manageReviewDialog = await screen.findByTestId(
      "manage-review-dialog"
    );
    expect(manageReviewDialog).toHaveTextContent("library");
    expect(manageReviewDialog).toHaveTextContent(cqlLibrary[0].id);
    expect(
      screen.queryByText("Mark Library Ready for Review")
    ).not.toBeInTheDocument();
  });

  const parentWithChildren = [
    {
      id: "parent-1",
      librarySetId: "set-1",
      cqlLibraryName: "parent lib",
      model: Model.QICORE,
      createdAt: "",
      createdBy: "testuser@example.com",
      lastModifiedAt: "",
      lastModifiedBy: "",
      draft: false,
      version: "2.0.000",
      cql: "library X version '1.0.0'",
      cqlErrors: false,
      active: true,
      hasAssociatedLibraries: true,
    },
  ] as unknown as CqlLibrary[];

  const expandedChildren = [
    {
      id: "child-ready",
      librarySetId: "set-1",
      cqlLibraryName: "child ready",
      model: Model.QICORE,
      draft: false,
      version: "1.0.000",
      active: true,
      hasAssociatedLibraries: true,
      // The list API projects the display label, not the ReviewStatus enum name.
      reviewStatus: "Ready",
    },
    {
      id: "child-none",
      librarySetId: "set-1",
      cqlLibraryName: "child none",
      model: Model.QICORE,
      draft: false,
      version: "0.9.000",
      active: true,
      hasAssociatedLibraries: true,
    },
  ] as unknown as CqlLibrary[];

  it("displays reviewStatus in expanded rows when LibraryReviewStatus flag is enabled", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
    mockCqlLibraryServiceResolved.getLibrariesByLibrarySetId = jest
      .fn()
      .mockResolvedValue(expandedChildren);

    render(
      <CqlLibraryList
        cqlLibraryList={parentWithChildren}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={parentWithChildren[0]}
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
        activeTab={0}
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

    const expandSection = await screen.findByTestId(
      "measure-name-0_expandArrow"
    );
    userEvent.click(within(expandSection).getByRole("button"));

    const readyCell = await screen.findByTestId(
      "cqlLibrary-button-child-ready_reviewStatus"
    );
    expect(readyCell).toHaveTextContent("Ready");

    const noneCell = screen.getByTestId(
      "cqlLibrary-button-child-none_reviewStatus"
    );
    expect(noneCell).toHaveTextContent("-");
  });

  const reviewLibraries = [
    {
      id: "review-lib-1",
      librarySetId: "review-set-1",
      cqlLibraryName: "review lib one",
      model: Model.QICORE,
      draft: false,
      version: "1.0.000",
      active: true,
      hasAssociatedLibraries: false,
      reviewStatus: "Ready",
      reviewers: ["Ada Lovelace", "Grace Hopper"],
    },
    {
      id: "review-lib-2",
      librarySetId: "review-set-2",
      cqlLibraryName: "review lib two",
      model: Model.QICORE,
      draft: false,
      version: "1.0.000",
      active: true,
      hasAssociatedLibraries: false,
      reviewStatus: "In Progress",
      reviewers: ["Katherine Johnson"],
    },
    {
      id: "review-lib-3",
      librarySetId: "review-set-3",
      cqlLibraryName: "review lib three",
      model: Model.QICORE,
      draft: false,
      version: "1.0.000",
      active: true,
      hasAssociatedLibraries: false,
      reviewStatus: "Complete",
      reviewers: ["Margaret Hamilton"],
    },
    {
      id: "review-lib-4",
      librarySetId: "review-set-4",
      cqlLibraryName: "review lib four",
      model: Model.QICORE,
      draft: false,
      version: "1.0.000",
      active: true,
      hasAssociatedLibraries: false,
    },
  ] as unknown as CqlLibrary[];

  const renderReviewsTab = () =>
    render(
      <CqlLibraryList
        cqlLibraryList={reviewLibraries}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={reviewLibraries[0]}
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
        totalItems={1}
        activeTab={3}
        totalPages={1}
        visibleItems={1}
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

  const renderMyReviewsTab = () =>
    render(
      <CqlLibraryList
        cqlLibraryList={reviewLibraries}
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={reviewLibraries[0]}
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
        totalItems={1}
        activeTab={4}
        totalPages={1}
        visibleItems={1}
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

  it("renders the Review column on the reviews tab regardless of the feature flag", async () => {
    // Feature flag intentionally left off: the reviews tab must always show Review.
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderReviewsTab();

    await screen.findByTestId("library-list-tbl");
    // Review column header + populated status cell are always present here.
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("review lib one")).toBeInTheDocument();
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });

  it("displays each review status in the Review column", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderReviewsTab();

    await screen.findByTestId("library-list-tbl");
    // Every status the API projects is shown as-is, not collapsed to "Ready".
    expect(screen.getByText("Ready")).toBeInTheDocument();
    expect(screen.getByText("In Progress")).toBeInTheDocument();
    expect(screen.getByText("Complete")).toBeInTheDocument();
    expect(screen.getByText("review lib four")).toBeInTheDocument();
  });

  it("shows reviewer names in a tooltip for Ready, In Progress, and Complete review statuses", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderReviewsTab();

    await screen.findByTestId("library-list-tbl");

    await userEvent.hover(screen.getByText("Ready"));
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();

    await userEvent.unhover(screen.getByText("Ready"));
    await waitFor(() => {
      expect(screen.queryByText("Ada Lovelace")).not.toBeInTheDocument();
    });

    await userEvent.hover(screen.getByText("In Progress"));
    expect(await screen.findByText("Katherine Johnson")).toBeInTheDocument();

    await userEvent.unhover(screen.getByText("In Progress"));
    await waitFor(() => {
      expect(screen.queryByText("Katherine Johnson")).not.toBeInTheDocument();
    });

    await userEvent.hover(screen.getByText("Complete"));
    expect(await screen.findByText("Margaret Hamilton")).toBeInTheDocument();
  });

  it("does not show a tooltip when review status is blank or reviewers are missing", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});

    render(
      <CqlLibraryList
        cqlLibraryList={
          [
            {
              id: "review-lib-no-reviewers",
              librarySetId: "review-set-no-reviewers",
              cqlLibraryName: "review lib without reviewers",
              model: Model.QICORE,
              draft: false,
              version: "1.0.000",
              active: true,
              hasAssociatedLibraries: false,
              reviewStatus: "Ready",
              reviewers: [],
            },
            {
              id: "review-lib-no-status",
              librarySetId: "review-set-no-status",
              cqlLibraryName: "review lib without status",
              model: Model.QICORE,
              draft: false,
              version: "1.0.000",
              active: true,
              hasAssociatedLibraries: false,
              reviewers: ["Hidden Reviewer"],
            },
          ] as unknown as CqlLibrary[]
        }
        onListUpdate={loadCqlLibraries}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={reviewLibraries[0]}
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
        totalItems={2}
        activeTab={3}
        totalPages={1}
        visibleItems={2}
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

    const readyCell = screen.getByTestId("measure-name-0_reviewStatus");
    await userEvent.hover(within(readyCell).getByText("Ready"));
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });

    const blankReviewCell = screen.getByTestId("measure-name-1_reviewStatus");
    expect(blankReviewCell).toHaveTextContent("-");
    await userEvent.hover(blankReviewCell);
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("renders Review column and tooltip behavior on My Reviews tab", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderMyReviewsTab();

    await screen.findByTestId("library-list-tbl");
    expect(screen.getByText("Review")).toBeInTheDocument();

    await userEvent.hover(screen.getByText("Ready"));
    expect(await screen.findByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Grace Hopper")).toBeInTheDocument();

    const blankReviewCell = screen.getByTestId("measure-name-3_reviewStatus");
    expect(blankReviewCell).toHaveTextContent("-");
    await userEvent.unhover(screen.getByText("Ready"));
    await userEvent.hover(blankReviewCell);
    await waitFor(() => {
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    });
  });

  it("renders the pagination control on the reviews tab", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderReviewsTab();

    await screen.findByTestId("library-list-tbl");
    // The reviews tab is paged client-side, so it gets the same control as the
    // other tabs rather than hiding it.
    expect(screen.getAllByText(/Items per page/i).length).toBeGreaterThan(0);
  });

  it("offers the Review filter option on the reviews tab", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderReviewsTab();

    await screen.findByTestId("library-list-tbl");
    const filterBy = screen.getByTestId("filter-by-select");
    userEvent.click(within(filterBy).getByRole("combobox", { hidden: true }));

    const options = await screen.findAllByRole("option");
    // Review is filterable here even with the feature flag off, matching the
    // Review column which the reviews tab always shows.
    expect(options.map((option) => option.textContent)).toContain("Review");
  });

  it("omits the Owner column on the reviews tab", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderReviewsTab();

    await screen.findByTestId("library-list-tbl");
    // Owner is not part of the reviews tab column set.
    expect(screen.queryByText("Owner")).not.toBeInTheDocument();
  });

  it("collapses the expanded section and clears expanded selection after a review is saved", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
    mockCqlLibraryServiceResolved.getLibrariesByLibrarySetId = jest
      .fn()
      .mockResolvedValue(expandedChildren);
    const onListUpdate = jest.fn().mockResolvedValue({});

    render(
      <CqlLibraryList
        cqlLibraryList={parentWithChildren}
        onListUpdate={onListUpdate}
        setSelectedLibraries={jest.fn()}
        deleteDraftDialog={jest.fn()}
        setDeleteDraftDialog={jest.fn()}
        selectedCQLLibrary={parentWithChildren[0]}
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
        activeTab={0}
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

    const expandSection = await screen.findByTestId(
      "measure-name-0_expandArrow"
    );
    userEvent.click(within(expandSection).getByRole("button"));

    const expandedRow = await screen.findByTestId(
      "cqlLibrary-expanded-child-ready"
    );
    userEvent.click(within(expandedRow).getByRole("checkbox"));

    userEvent.click(await screen.findByTestId("review-action-btn"));
    expect(
      await screen.findByText("Mark Library Ready for Review")
    ).toBeInTheDocument();

    userEvent.click(screen.getByTestId("review-dialog-mark-ready-switch"));
    await waitFor(() => {
      expect(screen.getByTestId("review-dialog-save-button")).toBeEnabled();
    });
    userEvent.click(screen.getByTestId("review-dialog-save-button"));

    await waitFor(() => {
      expect(onListUpdate).toHaveBeenCalled();
    });
    await waitFor(() => {
      expect(
        screen.queryByTestId("cqlLibrary-expanded-child-ready")
      ).not.toBeInTheDocument();
    });
  });

  const renderListForFilter = (activeTab: number) =>
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
        activeTab={activeTab}
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

  const openFilterByOptions = async () => {
    const filterBy = screen.getByTestId("filter-by-select");
    const dropdown = within(filterBy).getByRole("combobox", { hidden: true });
    userEvent.click(dropdown);
    const options = await screen.findAllByRole("option");
    return options.map((option) => option.textContent);
  };

  it("shows Review in the Filter By list on the Owned Libraries tab when LibraryReviewStatus is on", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
    renderListForFilter(0);

    expect(await openFilterByOptions()).toContain("Review");
  });

  it("does not show Review in the Filter By list on the All Libraries tab even when LibraryReviewStatus is on", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({
      LibraryReviewStatus: true,
    });
    renderListForFilter(2);

    expect(await openFilterByOptions()).not.toContain("Review");
  });

  it("does not show Review in the Filter By list when LibraryReviewStatus is off", async () => {
    (useFeatureFlags as jest.Mock).mockReturnValue({});
    renderListForFilter(0);

    expect(await openFilterByOptions()).not.toContain("Review");
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

  describe("transfer libraries", () => {
    const mockSetToastOpen = jest.fn();
    const mockSetToastMessage = jest.fn();
    const mockSetToastType = jest.fn();
    const mockSetStatusHandler = jest.fn();
    const mockSetTransferDialog = jest.fn();

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
          setTransferDialog={mockSetTransferDialog}
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
      jest.clearAllMocks();
    });

    it("toasts and refreshes the list when a transfer succeeds", async () => {
      const { getByTestId } = renderWithTransferDialog();

      fireEvent.click(getByTestId("transfer-dialog-success"));

      await waitFor(() => {
        expect(mockSetToastType).toHaveBeenCalledWith("success");
        expect(mockSetToastMessage).toHaveBeenCalledWith(
          "Library Successfully Transferred"
        );
        expect(mockSetToastOpen).toHaveBeenCalledWith(true);
        expect(loadCqlLibraries).toHaveBeenCalled();
      });
      expect(mockSetTransferDialog).toHaveBeenCalledWith({
        open: false,
        libraries: [],
      });
    });

    it("closes the dialog without refreshing the list when cancelled", async () => {
      const { getByTestId } = renderWithTransferDialog();

      fireEvent.click(getByTestId("transfer-dialog-close"));

      await waitFor(() => {
        expect(mockSetTransferDialog).toHaveBeenCalledWith({
          open: false,
          libraries: [],
        });
      });
      expect(mockSetToastOpen).toHaveBeenCalledWith(false);
      expect(loadCqlLibraries).not.toHaveBeenCalled();
    });
  });
});
